# 🔐 Supabase Authentication Setup Guide

## ⚠️ **Authentication Issue Detected**

Your registration is failing because Supabase authentication needs to be properly configured. Here's how to fix it:

---

## 🔧 **Step 1: Configure Supabase Authentication**

### **1. Go to Supabase Dashboard**
- Visit: https://supabase.com/dashboard/project/fviddsgjpsjvawghdkxy
- Navigate to **Authentication** → **Settings**

### **2. Configure Email Settings**
- **Enable Email Confirmations**: Set to **OFF** (for testing)
- **Enable Email Change Confirmations**: Set to **OFF** (for testing)
- **Enable Phone Confirmations**: Set to **OFF** (for testing)

### **3. Configure Auth Settings**
- **Site URL**: Set to `http://localhost:5174`
- **Redirect URLs**: Add `http://localhost:5174/**`
- **JWT Expiry**: Set to `3600` (1 hour)

---

## 🔧 **Step 2: Alternative - Use Magic Link Authentication**

If email confirmation is causing issues, we can switch to magic link authentication:

### **Update AuthContext.tsx**
```typescript
const register = async (email: string, password: string, name: string) => {
  setLoading(true);
  try {
    // Use magic link instead of password
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: {
          name,
          role: 'user'
        }
      }
    });

    if (error) throw error;
    
    alert('Check your email for the magic link to complete registration!');
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};
```

---

## 🔧 **Step 3: Quick Fix - Disable Email Confirmation**

### **In Supabase Dashboard:**
1. Go to **Authentication** → **Settings**
2. Find **Email Confirmations**
3. Set to **OFF**
4. Save changes

### **This will allow:**
- ✅ Immediate registration without email confirmation
- ✅ Direct login after registration
- ✅ No email setup required

---

## 🔧 **Step 4: Test Registration**

After making the changes:

1. **Try registering again** with a test email
2. **Check browser console** for detailed error messages
3. **Verify in Supabase Dashboard** that users are being created

---

## 🎯 **Expected Result**

After proper configuration:
- ✅ Registration works without email confirmation
- ✅ Users can login immediately
- ✅ Real authentication with Supabase
- ✅ Session persistence across browser refreshes

---

## 🚨 **If Still Having Issues**

### **Check Browser Console:**
- Open Developer Tools (F12)
- Look for error messages in Console tab
- Share the specific error message

### **Common Issues:**
1. **CORS errors** - Check site URL configuration
2. **Email confirmation required** - Disable in Supabase settings
3. **Invalid credentials** - Check Supabase URL and anon key
4. **Network errors** - Check internet connection

---

## 📞 **Need Help?**

If you're still experiencing issues:
1. Check the browser console for specific error messages
2. Verify your Supabase project URL and anon key
3. Ensure authentication is properly configured in Supabase dashboard

**Your UGC platform is ready - we just need to get authentication working!** 🚀 