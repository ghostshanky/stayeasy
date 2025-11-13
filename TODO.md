# Property Creation and Visibility Fix Plan

## Current Issues
- API endpoint mismatch: useProperties calls `/properties` but server exposes `/api/properties`
- System switches between mock and real data inconsistently
- User wants real database data, not mock data
- Properties not visible on website after creation

## Tasks
- [ ] Fix API endpoint in useProperties hook
- [ ] Ensure system uses real database data (disable mock mode)
- [ ] Test database connectivity
- [ ] Test property creation API
- [ ] Test property retrieval API
- [ ] Verify properties appear on landing page
- [ ] Add sample properties to database if needed

## Testing Checklist
- [ ] Property creation via AddPropertyForm
- [ ] Property retrieval via useProperties hook
- [ ] Properties visible on LandingPage
- [ ] Database persistence verification
