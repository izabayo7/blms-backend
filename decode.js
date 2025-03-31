const jwt = require('jsonwebtoken')
const config = require('config')
const dotenv = require('dotenv')
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZjI5MTQzMDM0ZDVlZjJlNzAyMGNlNzgiLCJzdXJOYW1lIjoiT2xpdmllciIsIm90aGVyTmFtZXMiOiJVbXVrdXJhIiwibmF0aW9uYWxJZCI6IjA5ODc2NTQzMjExMjM0NDYiLCJnZW5kZXIiOiJNYWxlIiwiRE9CIjoiMTk5My0wMS0wMVQwMDowMDowMC4wMDBaIiwicGhvbmUiOiIwOTg3NjU0MzIxIiwiZW1haWwiOiJ1bXVrdXJhQGdtYWlsLmNvbSIsInBhc3N3b3JkIjoiJDJhJDEwJG5WMFBLWVlMclRiQy9objRqRjcwTmU0SWdHNWVBTWxvSnNJQzJWU25CQjJvc2F4eFJpNEJhIiwiY2F0ZWdvcnkiOiJTdHVkZW50IiwiY29sbGVnZSI6IjVmMjZhMThjOTFhZjUyM2JmNDgxMGJjOCIsImlhdCI6MTYwMjMzMzY4MSwiZXhwIjoxNjAyMzMzNzQxfQ.YmGWloVvz9Cc9LJtlBdL58e-sfstkwtDAw_TYU3wc2I'
dotenv.config()
console.log(jwt.decode(token))
try {
    console.log(jwt.verify(token,config.get('auth_key')))
}
catch (err) {
    console.log(config.get('auth_key'))
    console.log('Invalid token')
}