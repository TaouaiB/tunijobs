# 📄 Job Module - CASL Permissions

This document describes access control rules for the `Job` resource using CASL.

## 🧠 Roles & Actions

| Role      | Action        | Resource | Condition                                          |
|-----------|---------------|----------|----------------------------------------------------|
| admin     | manage        | all      | No restrictions                                    |
| company   | create        | Job      | Always allowed                                     |
| company   | read          | Job      | All jobs                                           |
| company   | update/delete | Job      | Only own jobs (`job.companyId === user.companyId`) |
| candidate | read          | Job      | All jobs                                           |
| guest     | read          | Job      | PUBLIC jobs (later)                                |
---

## ✅ Notes

- `manage` = all actions (read, create, update, delete)
- Company ownership check is enforced via:  
  ```js
  can(['update', 'delete'], 'Job', { userId: user.id })
