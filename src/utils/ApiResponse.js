/**
 * Standardized success response shape sent from every controller:
 * { success, message, data }
 */
class ApiResponse {
  constructor(statusCode, data = null, message = "Success") {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;
