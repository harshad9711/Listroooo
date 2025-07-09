import React from "react";


export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listro.co
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Listro.co ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Listro.co is an AI-powered e-commerce listing optimization platform that helps businesses optimize their product listings across multiple marketplaces including Shopify, Amazon, Walmart, TikTok Shop, and Etsy. Our service includes:
            </p>
            <ul>
              <li>AI-powered listing optimization</li>
              <li>Multi-platform integration</li>
              <li>Performance analytics and insights</li>
              <li>User-generated content management</li>
              <li>Marketing automation tools</li>
              <li>Competitor analysis</li>
            </ul>

            <h2>3. User Accounts</h2>
            <p>
              To access certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights</li>
              <li>Transmit harmful, offensive, or inappropriate content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Use the Service for any commercial purpose without authorization</li>
            </ul>

            <h2>5. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. We comply with applicable data protection laws including GDPR and CCPA.
            </p>

            <h2>6. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by Listro.co and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h2>7. User-Generated Content</h2>
            <p>
              You retain ownership of content you submit to the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content in connection with the Service.
            </p>

            <h2>8. Third-Party Integrations</h2>
            <p>
              Our Service integrates with third-party platforms and services. Your use of these integrations is subject to the respective terms of service of those platforms. We are not responsible for the content or practices of third-party services.
            </p>

            <h2>9. Payment Terms</h2>
            <p>
              Some features of the Service require payment. All payments are processed securely through our payment partners. Subscription fees are billed in advance and are non-refundable except as required by law.
            </p>

            <h2>10. Service Availability</h2>
            <p>
              We strive to maintain high availability of the Service but cannot guarantee uninterrupted access. We may temporarily suspend the Service for maintenance, updates, or other operational reasons.
            </p>

            <h2>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Listro.co shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>

            <h2>12. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free.
            </p>

            <h2>13. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Listro.co and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
            </p>

            <h2>14. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
            </p>

            <h2>15. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Listro.co operates, without regard to its conflict of law provisions.
            </p>

            <h2>16. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date.
            </p>

            <h2>17. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="mb-2"><strong>Listro.co</strong></p>
              <p className="mb-1">Email: legal@listro.co</p>
              <p className="mb-1">Website: https://listro.co</p>
              <p>Address: [Your Business Address]</p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                By using Listro.co, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 