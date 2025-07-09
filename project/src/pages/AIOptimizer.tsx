import React, { useState, useEffect } from 'react';



const AIOptimizer = () => {
  const [step, setStep] = useState(1);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('title');
  
  // Mock product data
  const product = {
    id: '1',
    name: 'Wireless Earbuds Pro',
    description: 'Premium wireless earbuds with noise cancellation technology. Comes with charging case and multiple ear tips for maximum comfort.',
    platform: 'Amazon',
    category: 'Electronics > Audio > Headphones',
    keywords: 'wireless earbuds, noise cancelling, bluetooth earphones, in-ear headphones',
    originalTitle: 'Wireless Earbuds Pro with Noise Cancellation',
    originalDescription: 'Premium wireless earbuds with noise cancellation technology. Comes with charging case and multiple ear tips for maximum comfort. Features Bluetooth 5.0 connectivity, IPX5 water resistance, and up to 20 hours of battery life.',
    originalKeywords: 'wireless earbuds, noise cancelling, bluetooth headphones',
    optimizedTitle: 'Premium Wireless Earbuds Pro with Active Noise Cancellation, Bluetooth 5.0, IPX5 Waterproof, 20H Battery Life, Charging Case & Multiple Ear Tips',
    optimizedDescription: `Experience unparalleled audio clarity with our Premium Wireless Earbuds Pro featuring state-of-the-art Active Noise Cancellation technology that blocks out ambient sounds for immersive listening.

These Bluetooth 5.0 earbuds deliver a rock-solid connection up to 33 feet, with no audio dropouts or frustrating pairing issues. The advanced IPX5 waterproof rating ensures protection from sweat and rain, making them perfect for workouts and outdoor activities.

Enjoy up to 20 hours of battery life with the included compact charging case - 5 hours of continuous playtime on a single charge, plus 15 additional hours from the case. Quick-charge technology gives you 1 hour of playtime with just 10 minutes of charging.

Designed for all-day comfort, these earbuds come with multiple silicone ear tip sizes to ensure a perfect, comfortable fit for any ear shape. The intuitive touch controls allow easy management of your music, calls, and voice assistant without reaching for your phone.

What's in the box: Wireless Earbuds Pro, Charging Case, 3 Sizes of Ear Tips (S/M/L), USB-C Charging Cable, User Manual, and our 18-Month Warranty.`,
    optimizedKeywords: 'wireless earbuds, active noise cancellation, bluetooth 5.0 earbuds, waterproof earbuds, long battery earphones, comfortable earbuds, true wireless earbuds, earbuds with charging case, premium earbuds',
  };
  
  const handleOptimize = () => {
    setOptimizing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setOptimizing(false);
      setOptimizationComplete(true);
      setStep(3);
    }, 3000);
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 3) {
        setOptimizationComplete(false);
      }
    }
  };
  
  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">AI Listing Optimizer</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Let AI enhance your product listings for better visibility and conversion
        </p>
      </div>
      
      {/* Stepper */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center relative ${step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 flex items-center justify-center rounded-full ${step >= 1 ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-600 dark:border-indigo-400' : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'}`}>
            <span className="text-sm font-medium">1</span>
          </div>
          <span className="ml-2 text-sm font-medium">Select Product</span>
        </div>
        <div className={`flex-1 border-t-2 mx-4 ${step > 1 ? 'border-indigo-600 dark:border-indigo-400' : 'border-gray-300 dark:border-gray-600'}`}></div>
        <div className={`flex items-center relative ${step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 flex items-center justify-center rounded-full ${step >= 2 ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-600 dark:border-indigo-400' : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'}`}>
            <span className="text-sm font-medium">2</span>
          </div>
          <span className="ml-2 text-sm font-medium">Preferences</span>
        </div>
        <div className={`flex-1 border-t-2 mx-4 ${step > 2 ? 'border-indigo-600 dark:border-indigo-400' : 'border-gray-300 dark:border-gray-600'}`}></div>
        <div className={`flex items-center relative ${step >= 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 flex items-center justify-center rounded-full ${step >= 3 ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-600 dark:border-indigo-400' : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'}`}>
            <span className="text-sm font-medium">3</span>
          </div>
          <span className="ml-2 text-sm font-medium">Results</span>
        </div>
      </div>
      
      {/* Step 1: Select Product */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Select a product to optimize
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Choose a product from your store or marketplace
            </p>
          </div>
          
          <div className="p-6">
            <div className="relative mb-6">
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search your products..."
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer relative flex items-center">
                <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Platform: {product.platform}
                      </p>
                    </div>
                    <input 
                      type="radio" 
                      name="product" 
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                      checked 
                      onChange={() => {}}
                    />
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer relative flex items-center">
                <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        HD Security Camera
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Platform: Shopify
                      </p>
                    </div>
                    <input 
                      type="radio" 
                      name="product" 
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer relative flex items-center">
                <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Smart Watch X3
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Platform: Walmart
                      </p>
                    </div>
                    <input 
                      type="radio" 
                      name="product" 
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setStep(2)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 2: Optimization Preferences */}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Optimization Preferences
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Configure how AI should optimize your product listing
                </p>
              </div>
              <div className="text-right">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Product</h4>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">{product.name}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Sliders className="mr-2 h-4 w-4" />
                  Optimization Elements
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input 
                      id="title" 
                      type="checkbox" 
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      checked
                      onChange={() => {}}
                    />
                    <label htmlFor="title" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Title
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      id="description" 
                      type="checkbox" 
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      checked
                      onChange={() => {}}
                    />
                    <label htmlFor="description" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      id="keywords" 
                      type="checkbox" 
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      checked
                      onChange={() => {}}
                    />
                    <label htmlFor="keywords" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Keywords
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="border-t dark:border-gray-700 pt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Optimization Style
                </h4>
                <div>
                  <label htmlFor="style" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Writing Style
                  </label>
                  <select 
                    id="style"
                    className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option>Professional & Persuasive</option>
                    <option>Friendly & Conversational</option>
                    <option>Technical & Detailed</option>
                    <option>Minimal & Straightforward</option>
                  </select>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="focus" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Optimization Focus
                  </label>
                  <select 
                    id="focus"
                    className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option>Balanced (Search & Conversion)</option>
                    <option>Search Visibility</option>
                    <option>Conversion Rate</option>
                    <option>Brand Voice</option>
                  </select>
                </div>
              </div>
              
              <div className="border-t dark:border-gray-700 pt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Marketplace Guidelines
                </h4>
                <div className="flex items-center">
                  <input 
                    id="guidelines" 
                    type="checkbox" 
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked
                    onChange={() => {}}
                  />
                  <label htmlFor="guidelines" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Ensure compliance with {product.platform} guidelines
                  </label>
                </div>
              </div>
              
              <div className="border-t dark:border-gray-700 pt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Star className="mr-2 h-4 w-4" />
                  Target Audience
                </h4>
                <div>
                  <label htmlFor="audience" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Primary Audience
                  </label>
                  <select 
                    id="audience"
                    className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option>General Consumers</option>
                    <option>Tech Enthusiasts</option>
                    <option>Professionals</option>
                    <option>Budget Shoppers</option>
                    <option>Luxury Buyers</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <button 
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back
              </button>
              <button 
                onClick={handleOptimize}
                disabled={optimizing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {optimizing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Optimized Listing
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 3: Results */}
      {step === 3 && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Optimization Results
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Review and apply AI-generated optimizations
                </p>
              </div>
              <div className="text-right">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Product</h4>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">{product.name}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-6 border dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b dark:border-gray-700">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('title')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'title'
                        ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Title
                  </button>
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'description'
                        ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab('keywords')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'keywords'
                        ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Keywords
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                {activeTab === 'title' && (
                  <div>
                    <div className="mb-4 pb-4 border-b dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Original Title</h4>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{product.originalTitle}</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">AI-Optimized Title</h4>
                        <div className="flex space-x-2">
                          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3">
                        <p className="text-sm text-gray-900 dark:text-gray-100">{product.optimizedTitle}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center">
                          <button className="inline-flex items-center mr-3 text-green-600 dark:text-green-400">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            <span className="text-xs">Helpful</span>
                          </button>
                          <button className="inline-flex items-center text-gray-500 dark:text-gray-400">
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            <span className="text-xs">Not helpful</span>
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Character count: {product.optimizedTitle.length} / 200
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'description' && (
                  <div>
                    <div className="mb-4 pb-4 border-b dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Original Description</h4>
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{product.originalDescription}</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">AI-Optimized Description</h4>
                        <div className="flex space-x-2">
                          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 max-h-96 overflow-y-auto">
                        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{product.optimizedDescription}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center">
                          <button className="inline-flex items-center mr-3 text-green-600 dark:text-green-400">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            <span className="text-xs">Helpful</span>
                          </button>
                          <button className="inline-flex items-center text-gray-500 dark:text-gray-400">
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            <span className="text-xs">Not helpful</span>
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Character count: {product.optimizedDescription.length} / 2000
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'keywords' && (
                  <div>
                    <div className="mb-4 pb-4 border-b dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Original Keywords</h4>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{product.originalKeywords}</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">AI-Optimized Keywords</h4>
                        <div className="flex space-x-2">
                          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3">
                        <div className="flex flex-wrap gap-2">
                          {product.optimizedKeywords.split(', ').map((keyword, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center">
                          <button className="inline-flex items-center mr-3 text-green-600 dark:text-green-400">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            <span className="text-xs">Helpful</span>
                          </button>
                          <button className="inline-flex items-center text-gray-500 dark:text-gray-400">
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            <span className="text-xs">Not helpful</span>
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Keyword count: {product.optimizedKeywords.split(', ').length}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2 flex items-center">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Insights
              </h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Your optimized listing now includes high-traffic keywords like "active noise cancellation" and "waterproof earbuds" which could improve search visibility by up to 27%. The structured description highlights key features and benefits in an easy-to-scan format that may increase conversion rates.
              </p>
            </div>
            
            <div className="mt-8 flex justify-between">
              <button 
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back
              </button>
              <div className="flex space-x-3">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <Split className="mr-2 h-4 w-4" />
                  Create A/B Test
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIOptimizer;