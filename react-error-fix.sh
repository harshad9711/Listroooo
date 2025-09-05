#!/bin/bash

# React App Error Fix Script
# This script helps identify and fix common React import and component issues

echo "🔧 React App Error Fix Script Starting..."
echo "========================================="

# Function to check if a file exists
check_file_exists() {
    if [ -f "$1" ]; then
        echo "✅ Found: $1"
        return 0
    else
        echo "❌ Missing: $1"
        return 1
    fi
}

# Function to backup a file before modification
backup_file() {
    if [ -f "$1" ]; then
        cp "$1" "$1.backup.$(date +%Y%m%d_%H%M%S)"
        echo "📋 Backed up: $1"
    fi
}

# Function to add missing import to a file
add_import_if_missing() {
    local file="$1"
    local import_statement="$2"
    local component_name="$3"
    
    if [ -f "$file" ]; then
        if ! grep -q "$component_name" "$file"; then
            backup_file "$file"
            # Add import at the top after existing imports
            sed -i "1i\\$import_statement" "$file"
            echo "✅ Added import for $component_name to $file"
        else
            echo "ℹ️  Import for $component_name already exists in $file"
        fi
    fi
}

echo "1. Checking project structure..."
echo "--------------------------------"

# Check if we're in a React project
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in a React project directory (no package.json found)"
    exit 1
fi

if [ ! -d "src" ]; then
    echo "❌ Error: No src directory found"
    exit 1
fi

echo "✅ React project structure confirmed"

echo ""
echo "2. Identifying missing imports and components..."
echo "----------------------------------------------"

# Common component files to check
COMPONENTS_TO_CHECK=(
    "src/pages/EmailSmsGenerator.tsx"
    "src/pages/Chatbot.tsx"
    "src/pages/MarketingDashboard.tsx"
    "src/contexts/AuthContext.tsx"
)

# Check each component file
for component in "${COMPONENTS_TO_CHECK[@]}"; do
    if check_file_exists "$component"; then
        echo "🔍 Analyzing $component for missing imports..."
        
        # Check for common missing imports
        if grep -q "Users" "$component" && ! grep -q "import.*Users" "$component"; then
            echo "⚠️  Found undefined 'Users' in $component"
            echo "💡 Suggestion: Add appropriate import for Users component"
        fi
        
        if grep -q "Card" "$component" && ! grep -q "import.*Card" "$component"; then
            echo "⚠️  Found undefined 'Card' in $component"
            echo "💡 Suggestion: Add appropriate import for Card component"
        fi
        
        if grep -q "fetchMarketingMetrics" "$component" && ! grep -q "import.*fetchMarketingMetrics" "$component"; then
            echo "⚠️  Found undefined 'fetchMarketingMetrics' in $component"
            echo "💡 Suggestion: Define or import fetchMarketingMetrics function"
        fi
    fi
done

echo ""
echo "3. Fixing common import issues..."
echo "--------------------------------"

# Fix EmailSmsGenerator.tsx - Users component
EMAIL_SMS_FILE="src/pages/EmailSmsGenerator.tsx"
if [ -f "$EMAIL_SMS_FILE" ]; then
    backup_file "$EMAIL_SMS_FILE"
    
    # Check if Users import is missing and add it
    if grep -q "Users" "$EMAIL_SMS_FILE" && ! grep -q "import.*Users" "$EMAIL_SMS_FILE"; then
        # Try to find where Users component might be defined
        USERS_COMPONENT_PATH=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "export.*Users" | head -1)
        
        if [ -n "$USERS_COMPONENT_PATH" ]; then
            RELATIVE_PATH=$(realpath --relative-to="$(dirname "$EMAIL_SMS_FILE")" "$USERS_COMPONENT_PATH" | sed 's/\.tsx$//' | sed 's/\.ts$//')
            if [[ "$RELATIVE_PATH" != /* ]]; then
                RELATIVE_PATH="./$RELATIVE_PATH"
            fi
            
            # Add import statement
            sed -i "1i\\import { Users } from '$RELATIVE_PATH';" "$EMAIL_SMS_FILE"
            echo "✅ Added Users import to EmailSmsGenerator.tsx"
        else
            echo "⚠️  Users component not found. You may need to create it or check the component name."
            # Create a placeholder import comment
            sed -i "1i\\// TODO: Import Users component - import { Users } from 'path/to/Users';" "$EMAIL_SMS_FILE"
        fi
    fi
fi

# Fix Chatbot.tsx - Card component
CHATBOT_FILE="src/pages/Chatbot.tsx"
if [ -f "$CHATBOT_FILE" ]; then
    backup_file "$CHATBOT_FILE"
    
    # Check if Card import is missing and add it
    if grep -q "Card" "$CHATBOT_FILE" && ! grep -q "import.*Card" "$CHATBOT_FILE"; then
        # Check if using a UI library like shadcn/ui or if Card is a custom component
        if [ -d "src/components/ui" ]; then
            # Assume shadcn/ui structure
            sed -i "1i\\import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';" "$CHATBOT_FILE"
            echo "✅ Added Card import from UI components to Chatbot.tsx"
        else
            # Look for custom Card component
            CARD_COMPONENT_PATH=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "export.*Card" | head -1)
            
            if [ -n "$CARD_COMPONENT_PATH" ]; then
                RELATIVE_PATH=$(realpath --relative-to="$(dirname "$CHATBOT_FILE")" "$CARD_COMPONENT_PATH" | sed 's/\.tsx$//' | sed 's/\.ts$//')
                if [[ "$RELATIVE_PATH" != /* ]]; then
                    RELATIVE_PATH="./$RELATIVE_PATH"
                fi
                
                sed -i "1i\\import { Card } from '$RELATIVE_PATH';" "$CHATBOT_FILE"
                echo "✅ Added Card import to Chatbot.tsx"
            else
                echo "⚠️  Card component not found. Adding placeholder import."
                sed -i "1i\\// TODO: Import Card component - import { Card } from 'path/to/Card';" "$CHATBOT_FILE"
            fi
        fi
    fi
fi

# Fix MarketingDashboard.tsx - fetchMarketingMetrics function
MARKETING_FILE="src/pages/MarketingDashboard.tsx"
if [ -f "$MARKETING_FILE" ]; then
    backup_file "$MARKETING_FILE"
    
    # Check if fetchMarketingMetrics is used but not defined/imported
    if grep -q "fetchMarketingMetrics" "$MARKETING_FILE" && ! grep -q "import.*fetchMarketingMetrics\|const fetchMarketingMetrics\|function fetchMarketingMetrics" "$MARKETING_FILE"; then
        echo "⚠️  fetchMarketingMetrics function is undefined in MarketingDashboard.tsx"
        
        # Look for the function in services or utils
        FETCH_FUNCTION_PATH=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "fetchMarketingMetrics" | grep -v "$MARKETING_FILE" | head -1)
        
        if [ -n "$FETCH_FUNCTION_PATH" ]; then
            RELATIVE_PATH=$(realpath --relative-to="$(dirname "$MARKETING_FILE")" "$FETCH_FUNCTION_PATH" | sed 's/\.tsx$//' | sed 's/\.ts$//')
            if [[ "$RELATIVE_PATH" != /* ]]; then
                RELATIVE_PATH="./$RELATIVE_PATH"
            fi
            
            sed -i "1i\\import { fetchMarketingMetrics } from '$RELATIVE_PATH';" "$MARKETING_FILE"
            echo "✅ Added fetchMarketingMetrics import to MarketingDashboard.tsx"
        else
            echo "📝 Creating placeholder fetchMarketingMetrics function..."
            # Add a placeholder function at the top of the file
            cat > temp_function.txt << 'EOF'
// Placeholder function - replace with actual implementation
const fetchMarketingMetrics = async () => {
  try {
    // TODO: Implement actual marketing metrics fetching logic
    console.log('fetchMarketingMetrics called - implement this function');
    return {
      metrics: [],
      success: true
    };
  } catch (error) {
    console.error('Error fetching marketing metrics:', error);
    throw error;
  }
};

EOF
            # Insert the function after imports
            sed -i "/^import/r temp_function.txt" "$MARKETING_FILE"
            rm temp_function.txt
            echo "✅ Added placeholder fetchMarketingMetrics function"
        fi
    fi
fi

echo ""
echo "4. Checking SVG viewBox issues..."
echo "--------------------------------"

# Find and fix SVG viewBox issues
SVG_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "viewBox" 2>/dev/null || true)

if [ -n "$SVG_FILES" ]; then
    for file in $SVG_FILES; do
        if grep -q 'viewBox.*\\\' "$file"; then
            backup_file "$file"
            # Fix escaped quotes in viewBox
            sed -i 's/viewBox="[^"]*\\\"/viewBox="0 0 24 24"/g' "$file"
            echo "✅ Fixed viewBox attribute in $file"
        fi
    done
else
    echo "ℹ️  No SVG viewBox issues found in TypeScript files"
fi

echo ""
echo "5. Checking authentication and API issues..."
echo "-------------------------------------------"

# Check for Supabase configuration
if [ -f ".env" ] || [ -f ".env.local" ]; then
    echo "✅ Environment file found"
    
    # Check if Supabase keys are configured
    if grep -q "SUPABASE" ".env" 2>/dev/null || grep -q "SUPABASE" ".env.local" 2>/dev/null; then
        echo "ℹ️  Supabase configuration detected"
        echo "💡 Verify your Supabase URL and API keys are correct"
        echo "💡 Check that your Supabase project is active and accessible"
    fi
else
    echo "⚠️  No environment file found"
    echo "📝 Creating sample .env.local file..."
    
    cat > .env.local << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Add other environment variables as needed
EOF
    echo "✅ Created .env.local template - please add your actual values"
fi

echo ""
echo "6. Generating quick fixes..."
echo "----------------------------"

# Create a quick fix file with common solutions
cat > QUICK_FIXES.md << 'EOF'
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

EOF

echo "✅ Created QUICK_FIXES.md with common solutions"

echo ""
echo "7. Running additional checks..."
echo "------------------------------"

# Check package.json for potential issues
if [ -f "package.json" ]; then
    echo "📦 Checking package.json..."
    
    # Check if React and TypeScript versions are compatible
    REACT_VERSION=$(grep '"react"' package.json | sed 's/.*"react": "//; s/".*//' | head -1)
    TS_VERSION=$(grep '"typescript"' package.json | sed 's/.*"typescript": "//; s/".*//' | head -1)
    
    echo "ℹ️  React version: $REACT_VERSION"
    echo "ℹ️  TypeScript version: $TS_VERSION"
    
    # Suggest updating dependencies if they seem outdated
    echo "💡 Consider running 'npm update' to update dependencies"
fi

# Check for common missing dependencies
echo ""
echo "📋 Suggested npm commands to run:"
echo "npm install  # Install missing dependencies"
echo "npm run build  # Test build process"
echo "npm run dev  # Start development server"

echo ""
echo "🎉 Error Fix Script Completed!"
echo "=============================="
echo ""
echo "📝 Summary of actions taken:"
echo "- ✅ Analyzed component files for missing imports"
echo "- ✅ Fixed common import issues where possible"
echo "- ✅ Created backup files for modified components"
echo "- ✅ Generated QUICK_FIXES.md with manual solutions"
echo "- ✅ Identified potential API and configuration issues"
echo ""
echo "🔍 Next steps:"
echo "1. Review any TODO comments added to your files"
echo "2. Check QUICK_FIXES.md for manual fixes needed"
echo "3. Verify your .env configuration"
echo "4. Test your application functionality"
echo "5. If issues persist, check the specific error messages and apply targeted fixes"
echo ""
echo "💡 Tip: Run 'npm run dev' and check the browser console for any remaining errors" 