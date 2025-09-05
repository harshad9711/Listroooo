import React, { useState } from "react";
import { Card, Title, Text, Button, Textarea } from '@tremor/react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Star, 
  Send 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { veo3Production } from '../../services/veo3Production';

interface Veo3FeedbackProps {
  resultId: string;
  userId: string;
  onFeedbackSubmitted?: () => void;
  onClose?: () => void;
}

export default function Veo3Feedback({ resultId, userId, onFeedbackSubmitted, onClose }: Veo3FeedbackProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    
    try {
      await veo3Production.submitFeedback(userId, resultId, rating, comment);
      setSubmitted(true);
      toast.success('Feedback submitted! Thank you.');
      onFeedbackSubmitted?.();
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <ThumbsUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <Title className="text-green-600 dark:text-green-400 mb-2">Thank You!</Title>
          <Text className="text-gray-600 dark:text-gray-400">
            Your feedback helps us improve our AI generation quality.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="h-5 w-5 text-indigo-500" />
          <Title>How was this result?</Title>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <Text className="text-gray-700 dark:text-gray-300 mb-2">Rate this generation:</Text>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 rounded transition-colors ${
                    star <= rating
                      ? 'text-yellow-400 hover:text-yellow-500'
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {rating === 0 && 'Click to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </Text>
          </div>

          {/* Quick Feedback */}
          <div>
            <Text className="text-gray-700 dark:text-gray-300 mb-2">Quick feedback:</Text>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={rating >= 4 ? "primary" : "secondary"}
                size="xs"
                icon={ThumbsUp}
                onClick={() => setRating(5)}
              >
                Great!
              </Button>
              <Button
                type="button"
                variant={rating <= 2 ? "primary" : "secondary"}
                size="xs"
                icon={ThumbsDown}
                onClick={() => setRating(2)}
              >
                Needs work
              </Button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <Text className="text-gray-700 dark:text-gray-300 mb-2">
              Additional comments (optional):
            </Text>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or what could be improved?"
              rows={3}
              className="w-full"
            />
          </div>

          {/* Submit */}
          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={submitting || rating === 0}
              icon={submitting ? undefined : Send}
              loading={submitting}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Skip
              </Button>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
} 