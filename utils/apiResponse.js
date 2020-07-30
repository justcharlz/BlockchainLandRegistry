exports.ApiResponse = class {

    constructor () {
        this.response = {}
    }

    Success (code, msg, data) {
        this.response.status = true
        this.response.code = code
        this.response.message = msg
        
        if (Object.keys(data).length !== 0 && data.constructor === Object ) {
            this.response.data = data
        }
    
        return this.response
        
    }

    Error (code, statusCode, msg, errors, error) {

        this.response.status = false
        this.response.code = code
        this.response.statusCode = statusCode
        this.response.message = msg
        this.response.validationError = errors
        this.response.stack = error

        return this.response

    }

    PlainSuccess (code, msg) {

        this.response.status = true
        this.response.code = code
        this.response.message = msg

        return this.response

    }

    PlainError (code, statusCode, msg, stack) {
        this.response.status = false
        this.response.code = code
        this.response.statusCode = statusCode
        this.response.message = msg
        this.response.stack = stack

        return this.response
    }
}