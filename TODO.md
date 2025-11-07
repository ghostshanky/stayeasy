# Fix TypeScript Errors

## Tasks
- [ ] Remove unused 'User' import in server/middleware/audit.ts
- [ ] Remove unused 'invoiceId' parameter in server/audit-logger.ts logInvoiceGeneration method
- [ ] Remove unused 'metadata' parameter in server/audit-logger.ts logUserAction method
- [x] Remove unused 'propertyId' parameter in server/audit-logger.ts logReviewCreation method
- [x] Remove unused 'type' parameter in server/controllers/propertiesController.ts getProperties method
- [ ] Add type annotation for 'property' in server/controllers/propertiesController.ts manageAvailability method
- [ ] Add type annotation for 'booking' in server/controllers/bookingsController.ts updateBookingStatus method
- [ ] Run build to verify errors are fixed
