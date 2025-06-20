import { ForbiddenError } from '@casl/ability'
import ApiError from '../../utils/ApiError'

export function authorize(action, subject) {
  return (req, res, next) => {
    try {
      ForbiddenError.from(req.ability).throwUnlessCan(action, subject)
      next()
    } catch (error) {
      next(new ApiError(403, 'Forbidden: ' + error.message))
    }
  }
}
