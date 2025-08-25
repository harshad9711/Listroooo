import { Helmet } from 'react-helmet';


export default function Verification() {
  return (
    <>
      <Helmet>
        <meta name="tiktok-developers-site-verification" content="HQk5C9P43EC4VP9SVN4qZYptUZFDByOz" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Listro.co
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            TikTok Developer Site Verification
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Verification Code: HQk5C9P43EC4VP9SVN4qZYptUZFDByOz
          </p>
        </div>
      </div>
    </>
  );
} 