# Quick Fixes for Common React Errors

## 1. ReferenceError: [Component] is not defined

**Problem**: Using a component without importing it
**Solution**: Add the missing import statement at the top of your file

```typescript
// For UI components (shadcn/ui example)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// For custom components
import { Users } from '../components/Users';
import { SomeComponent } from './path/to/SomeComponent';
```

## 2. Function is not defined

**Problem**: Using a function that hasn't been imported or defined
**Solution**: Either import the function or define it

```typescript
// Import from service file
import { fetchMarketingMetrics } from '../services/marketingService';

// Or define locally
const fetchMarketingMetrics = async () => {
  // Implementation here
};
```

## 3. SVG viewBox errors

**Problem**: Malformed viewBox attributes
**Solution**: Ensure proper quote escaping

```jsx
// Wrong
<svg viewBox="0 0 20 20\\">

// Right  
<svg viewBox="0 0 20 20">
```

## 4. 401 Unauthorized errors

**Problem**: Invalid or missing API credentials
**Solutions**:
- Check your .env file has correct Supabase credentials
- Verify Supabase project is active
- Check API key permissions
- Ensure authentication is working properly

## 5. React Router warnings

**Problem**: Using outdated Router configuration
**Solution**: Add future flags to your Router configuration

```jsx
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  {/* Your app */}
</BrowserRouter>
```

