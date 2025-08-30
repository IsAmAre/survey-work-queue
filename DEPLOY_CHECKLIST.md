# Deployment Checklist

This checklist helps prevent deployment errors by ensuring all code quality checks pass before deployment.

## Pre-deployment Steps

### 1. Run Local Build
Always run the build command locally to catch issues early:
```bash
npm run build
```

### 2. Fix Common Issues
- **TypeScript errors**: Use proper typing instead of `any`
- **Unused variables**: Remove or prefix with underscore `_` if needed
- **Missing dependencies**: Add missing dependencies to useEffect hooks
- **ESLint warnings**: Run `npm run lint` to fix

### 3. Test Critical Paths
- [ ] Search functionality works
- [ ] Admin login works
- [ ] Data management (CRUD operations)
- [ ] File upload functionality
- [ ] Export functionality

## Automated Checks (Pre-commit hooks)

The following checks run automatically before each commit:
- TypeScript type checking (`npm run typecheck`)
- ESLint validation (`npm run lint:check`)

## Common Deployment Errors & Solutions

### TypeScript Errors
- **Issue**: `Unexpected any`
  - **Solution**: Replace `any` with specific types like `Record<string, string | number>`

- **Issue**: Unused variables
  - **Solution**: Remove unused imports/variables or use them

### Next.js 15 Compatibility 
- **Issue**: Dynamic route params are now Promises
  - **Solution**: Use `await params` instead of direct access

### React Hooks Dependencies
- **Issue**: Missing dependencies in useEffect
  - **Solution**: Wrap functions in `useCallback` and add to dependency array

## Vercel Build Environment
- Build runs with strict TypeScript checking
- All ESLint errors cause build failures
- Environment variables must be properly configured

## Recovery Steps
If deployment fails:
1. Check the error log for specific issues
2. Fix locally and test with `npm run build`
3. Commit and redeploy
4. Verify functionality in production