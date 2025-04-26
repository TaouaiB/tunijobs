// This utility function takes an object and an array of allowed fields,
// and returns a new object containing only the allowed fields from the original object.
module.exports = function pickFields(obj, allowedFields) {
    const result = {};
    allowedFields.forEach(field => {
      if (obj.hasOwnProperty(field)) {
        result[field] = obj[field];
      }
    });
    return result;
  };
  