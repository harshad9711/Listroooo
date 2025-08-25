import { supabase } from '../lib/supabase';

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'welcome' | 'abandoned_cart' | 'reengagement' | 'new_drop' | 'holiday_sale' | 'back_in_stock' | 'order_confirmation' | 'shipping_update' | 'review_request' | 'loyalty_reward' | 'flash_sale' | 'product_recommendation';
  subject: string;
  preview_text: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  category: 'welcome' | 'abandoned_cart' | 'reengagement' | 'new_drop' | 'holiday_sale' | 'back_in_stock' | 'order_confirmation' | 'shipping_update' | 'review_request' | 'loyalty_reward' | 'flash_sale' | 'product_recommendation';
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'both';
  template_id: string;
  subject?: string;
  content: string;
  target_audience: string[];
  scheduled_date?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    revenue_generated: number;
  };
  created_at: string;
  updated_at: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
  }[];
  customer_count: number;
  created_at: string;
}

// Email template categories and their purposes
export const EMAIL_CATEGORIES = {
  welcome: {
    name: 'Welcome Series',
    description: 'Onboarding new customers',
    purpose: 'Introduce your brand, set expectations, and encourage first purchase'
  },
  abandoned_cart: {
    name: 'Abandoned Cart Recovery',
    description: 'Recover lost sales',
    purpose: 'Remind customers about items left in cart with incentives'
  },
  reengagement: {
    name: 'Customer Re-engagement',
    description: 'Win back inactive customers',
    purpose: 'Reconnect with customers who haven\'t purchased recently'
  },
  new_drop: {
    name: 'New Product Drops',
    description: 'Announce new products',
    purpose: 'Create excitement and urgency for new product launches'
  },
  holiday_sale: {
    name: 'Holiday Sales & Promotions',
    description: 'Seasonal marketing campaigns',
    purpose: 'Drive sales during holidays and special occasions'
  },
  back_in_stock: {
    name: 'Back in Stock Notifications',
    description: 'Notify when products are available',
    purpose: 'Convert waitlist customers into buyers'
  },
  order_confirmation: {
    name: 'Order Confirmations',
    description: 'Confirm orders and set expectations',
    purpose: 'Provide order details and build confidence'
  },
  shipping_update: {
    name: 'Shipping Updates',
    description: 'Keep customers informed about delivery',
    purpose: 'Reduce support inquiries and improve customer experience'
  },
  review_request: {
    name: 'Review Requests',
    description: 'Collect customer feedback',
    purpose: 'Build social proof and improve products'
  },
  loyalty_reward: {
    name: 'Loyalty Rewards',
    description: 'Reward loyal customers',
    purpose: 'Increase customer lifetime value and retention'
  },
  flash_sale: {
    name: 'Flash Sales',
    description: 'Limited-time offers',
    purpose: 'Create urgency and drive immediate sales'
  },
  product_recommendation: {
    name: 'Product Recommendations',
    description: 'Personalized product suggestions',
    purpose: 'Increase average order value and customer satisfaction'
  }
};

// SMS template categories (shorter, more direct)
export const SMS_CATEGORIES = {
  welcome: {
    name: 'Welcome SMS',
    description: 'Welcome new subscribers',
    purpose: 'Quick welcome and first offer'
  },
  abandoned_cart: {
    name: 'Cart Recovery',
    description: 'Recover abandoned carts',
    purpose: 'Quick reminder with incentive'
  },
  reengagement: {
    name: 'Re-engagement',
    description: 'Win back customers',
    purpose: 'Special offer for returning customers'
  },
  new_drop: {
    name: 'New Drop Alert',
    description: 'Announce new products',
    purpose: 'Create urgency for new launches'
  },
  holiday_sale: {
    name: 'Holiday Promo',
    description: 'Seasonal promotions',
    purpose: 'Drive holiday sales'
  },
  back_in_stock: {
    name: 'Back in Stock',
    description: 'Product availability',
    purpose: 'Convert waitlist to sales'
  },
  order_confirmation: {
    name: 'Order Confirmation',
    description: 'Confirm orders',
    purpose: 'Provide order details'
  },
  shipping_update: {
    name: 'Shipping Update',
    description: 'Delivery updates',
    purpose: 'Keep customers informed'
  },
  review_request: {
    name: 'Review Request',
    description: 'Request feedback',
    purpose: 'Collect reviews'
  },
  loyalty_reward: {
    name: 'Loyalty Reward',
    description: 'Reward customers',
    purpose: 'Increase retention'
  },
  flash_sale: {
    name: 'Flash Sale',
    description: 'Limited offers',
    purpose: 'Create urgency'
  },
  product_recommendation: {
    name: 'Product Rec',
    description: 'Recommend products',
    purpose: 'Increase AOV'
  }
};

// Variable placeholders for personalization
export const EMAIL_VARIABLES = {
  customer: ['{{customer_name}}', '{{customer_email}}', '{{customer_phone}}'],
  order: ['{{order_number}}', '{{order_total}}', '{{order_date}}', '{{shipping_address}}'],
  product: ['{{product_name}}', '{{product_price}}', '{{product_image}}', '{{product_url}}'],
  cart: ['{{cart_items}}', '{{cart_total}}', '{{cart_url}}'],
  discount: ['{{discount_code}}', '{{discount_amount}}', '{{discount_percentage}}'],
  time: ['{{expiry_date}}', '{{sale_end_date}}', '{{launch_date}}'],
  brand: ['{{brand_name}}', '{{brand_logo}}', '{{website_url}}', '{{support_email}}'],
  social: ['{{facebook_url}}', '{{instagram_url}}', '{{tiktok_url}}', '{{twitter_url}}']
};

export const SMS_VARIABLES = {
  customer: ['{{customer_name}}'],
  order: ['{{order_number}}', '{{order_total}}'],
  product: ['{{product_name}}', '{{product_price}}'],
  cart: ['{{cart_total}}'],
  discount: ['{{discount_code}}', '{{discount_amount}}'],
  time: ['{{expiry_date}}'],
  brand: ['{{brand_name}}', '{{website_url}}']
};

export class EmailSmsGeneratorService {
  // Generate AI-powered email content
  async generateEmailContent(
    category: string,
    brandName: string,
    productInfo?: any
  ): Promise<{ subject: string; preview_text: string; content: string }> {
    try {
      // In a real implementation, this would call an AI service like OpenAI
      // For now, we'll use predefined templates with AI-like variations
      
      const templates = this.getEmailTemplateVariations(category, brandName, productInfo);
      const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
      
      // Apply AI-like variations and personalization
      const subject = this.applyVariations(selectedTemplate.subject, brandName, productInfo);
      const preview_text = this.applyVariations(selectedTemplate.preview_text, brandName, productInfo);
      const content = this.applyVariations(selectedTemplate.content, brandName, productInfo);
      
      return { subject, preview_text, content };
    } catch (error) {
      console.error('Error generating email content:', error);
      throw error;
    }
  }

  // Generate AI-powered SMS content
  async generateSmsContent(
    category: string,
    brandName: string,
    productInfo?: any
  ): Promise<{ content: string }> {
    try {
      const templates = this.getSmsTemplateVariations(category, brandName, productInfo);
      const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
      
      const content = this.applyVariations(selectedTemplate.content, brandName, productInfo);
      
      return { content };
    } catch (error) {
      console.error('Error generating SMS content:', error);
      throw error;
    }
  }

  // Get email templates for a category
  private getEmailTemplateVariations(category: string, brandName: string, productInfo?: any) {
    const templates: any[] = [];
    
    switch (category) {
      case 'welcome':
        templates.push(
          {
            subject: `Welcome to ${brandName}! 🎉 Your exclusive 20% off awaits`,
            preview_text: `Start your journey with us and discover amazing products. Plus, get 20% off your first order!`,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333; text-align: center;">Welcome to ${brandName}! 🎉</h1>
                
                <p>Hi {{customer_name}},</p>
                
                <p>We're thrilled to have you join the ${brandName} family! You're now part of an exclusive community of trendsetters and innovators.</p>
                
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0;">
                  <h2 style="margin: 0 0 10px 0;">🎁 Welcome Gift: 20% OFF</h2>
                  <p style="font-size: 18px; margin: 0;">Use code: <strong>WELCOME20</strong></p>
                  <p style="font-size: 14px; margin: 10px 0 0 0;">Valid for 7 days</p>
                </div>
                
                <h3>What makes ${brandName} special?</h3>
                <ul>
                  <li>✨ Premium quality products</li>
                  <li>🚚 Fast, free shipping</li>
                  <li>💎 Exclusive member benefits</li>
                  <li>🎯 Personalized recommendations</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{website_url}}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Shopping Now</a>
                </div>
                
                <p>Happy shopping!</p>
                <p>The ${brandName} Team</p>
              </div>
            `
          }
        );
        break;
        
      case 'abandoned_cart':
        templates.push(
          {
            subject: `Don't forget your cart! 🛒 Complete your order and save 15%`,
            preview_text: `Your items are waiting for you. Complete your purchase now and enjoy 15% off!`,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333; text-align: center;">Your Cart is Waiting! 🛒</h1>
                
                <p>Hi {{customer_name}},</p>
                
                <p>We noticed you left some amazing items in your cart. Don't let them get away!</p>
                
                <div style="border: 2px solid #f0f0f0; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <h3>Your Cart Items:</h3>
                  {{cart_items}}
                  <p><strong>Total: {{cart_total}}</strong></p>
                </div>
                
                <div style="background: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                  <h2 style="margin: 0 0 10px 0;">🔥 Limited Time Offer!</h2>
                  <p style="font-size: 18px; margin: 0;">Get 15% off when you complete your order</p>
                  <p style="font-size: 14px; margin: 10px 0 0 0;">Use code: <strong>CART15</strong></p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{cart_url}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Your Order</a>
                </div>
                
                <p><em>This offer expires in 24 hours!</em></p>
                
                <p>Best regards,<br>The ${brandName} Team</p>
              </div>
            `
          }
        );
        break;
        
      case 'new_drop':
        templates.push(
          {
            subject: `🔥 NEW DROP ALERT: ${productInfo?.name || 'Exclusive Collection'} Now Live!`,
            preview_text: `Be the first to shop our latest collection. Limited quantities available!`,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333; text-align: center;">🔥 NEW DROP ALERT 🔥</h1>
                
                <p>Hi {{customer_name}},</p>
                
                <p>The moment you've been waiting for is here! Our latest collection is now live and it's absolutely stunning.</p>
                
                <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0;">
                  <h2 style="margin: 0 0 15px 0;">${productInfo?.name || 'Exclusive Collection'}</h2>
                  <p style="font-size: 18px; margin: 0;">Starting at {{product_price}}</p>
                  <p style="font-size: 14px; margin: 10px 0 0 0;">Limited quantities available</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <img src="{{product_image}}" alt="${productInfo?.name || 'New Product'}" style="max-width: 100%; border-radius: 10px;">
                </div>
                
                <h3>Why you'll love this collection:</h3>
                <ul>
                  <li>🎨 Unique designs you won't find anywhere else</li>
                  <li>✨ Premium quality materials</li>
                  <li>🚀 Limited edition - get yours before they're gone</li>
                  <li>💎 Early access for our VIP customers</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{product_url}}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Shop the Collection</a>
                </div>
                
                <p><em>Don't wait - these pieces are selling fast!</em></p>
                
                <p>Happy shopping!<br>The ${brandName} Team</p>
              </div>
            `
          }
        );
        break;
        
      case 'holiday_sale':
        templates.push(
          {
            subject: `🎄 Holiday Sale: Up to 50% OFF + Free Shipping!`,
            preview_text: `Celebrate the holidays with amazing deals. Shop now and save big!`,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333; text-align: center;">🎄 Holiday Sale is Here! 🎄</h1>
                
                <p>Hi {{customer_name}},</p>
                
                <p>'Tis the season to be shopping! We're spreading holiday cheer with incredible deals on your favorite products.</p>
                
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0;">
                  <h2 style="margin: 0 0 15px 0;">🎁 HOLIDAY SALE</h2>
                  <p style="font-size: 24px; margin: 0; font-weight: bold;">UP TO 50% OFF</p>
                  <p style="font-size: 18px; margin: 10px 0;">+ FREE SHIPPING</p>
                  <p style="font-size: 14px; margin: 10px 0 0 0;">Ends {{sale_end_date}}</p>
                </div>
                
                <h3>What's on sale:</h3>
                <ul>
                  <li>🎯 All categories included</li>
                  <li>🚚 Free shipping on orders over $50</li>
                  <li>💎 Extra 10% off with code: HOLIDAY10</li>
                  <li>⏰ Limited time only</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{website_url}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Shop the Sale</a>
                </div>
                
                <p><em>Don't miss out on these amazing deals!</em></p>
                
                <p>Happy holidays!<br>The ${brandName} Team</p>
              </div>
            `
          }
        );
        break;
        
      case 'reengagement':
        templates.push(
          {
            subject: `We miss you! 💝 Special 25% off just for you`,
            preview_text: `It's been a while! Come back and enjoy 25% off your next order.`,
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333; text-align: center;">We Miss You! 💝</h1>
                
                <p>Hi {{customer_name}},</p>
                
                <p>It's been a while since we've seen you, and we've missed you! We hope you're doing well.</p>
                
                <p>To show you how much we care, we've prepared something special just for you.</p>
                
                <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0;">
                  <h2 style="margin: 0 0 15px 0;">💝 Welcome Back Offer</h2>
                  <p style="font-size: 24px; margin: 0; font-weight: bold;">25% OFF</p>
                  <p style="font-size: 18px; margin: 10px 0;">Your Next Order</p>
                  <p style="font-size: 14px; margin: 10px 0 0 0;">Use code: <strong>MISSYOU25</strong></p>
                </div>
                
                <h3>What's new since you've been away:</h3>
                <ul>
                  <li>🆕 New product collections</li>
                  <li>🎯 Improved customer experience</li>
                  <li>🚚 Faster shipping options</li>
                  <li>💎 Exclusive member benefits</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="{{website_url}}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Come Back & Save</a>
                </div>
                
                <p><em>This offer is valid for 7 days only!</em></p>
                
                <p>We can't wait to see you again!<br>The ${brandName} Team</p>
              </div>
            `
          }
        );
        break;
    }
    
    return templates;
  }

  // Get SMS templates for a category
  private getSmsTemplateVariations(category: string, brandName: string, productInfo?: any) {
    const templates: any[] = [];
    
    switch (category) {
      case 'welcome':
        templates.push({
          content: `Welcome to ${brandName}! 🎉 Use code WELCOME20 for 20% off your first order. Shop now: {{website_url}}`
        });
        break;
        
      case 'abandoned_cart':
        templates.push({
          content: `Don't forget your cart! 🛒 Complete your order and save 15% with code CART15. {{cart_url}}`
        });
        break;
        
      case 'new_drop':
        templates.push({
          content: `🔥 NEW DROP: ${productInfo?.name || 'Exclusive Collection'} is live! Limited quantities. Shop now: {{product_url}}`
        });
        break;
        
      case 'holiday_sale':
        templates.push({
          content: `🎄 Holiday Sale: Up to 50% OFF + Free Shipping! Use code HOLIDAY10 for extra savings. {{website_url}}`
        });
        break;
        
      case 'reengagement':
        templates.push({
          content: `We miss you! 💝 Come back and enjoy 25% off with code MISSYOU25. Valid for 7 days. {{website_url}}`
        });
        break;
        
      case 'flash_sale':
        templates.push({
          content: `⚡ FLASH SALE: 40% OFF everything! Ends in 2 hours. Use code FLASH40. {{website_url}}`
        });
        break;
        
      case 'back_in_stock':
        templates.push({
          content: `✅ Back in Stock: ${productInfo?.name || 'Your item'} is available again! Order now: {{product_url}}`
        });
        break;
    }
    
    return templates;
  }

  // Apply variations and personalization to content
  private applyVariations(content: string, brandName: string, productInfo?: any): string {
    let result = content;
    
    // Replace brand name
    result = result.replace(/\{\{brand_name\}\}/g, brandName);
    
    // Replace product info if available
    if (productInfo) {
      result = result.replace(/\{\{product_name\}\}/g, productInfo.name || 'Product');
      result = result.replace(/\{\{product_price\}\}/g, productInfo.price || '$XX.XX');
      result = result.replace(/\{\{product_url\}\}/g, productInfo.url || '#');
    }
    
    // Add random variations for more natural feel
    const variations = {
      greetings: ['Hi', 'Hello', 'Hey there', 'Greetings', 'Hi there'],
      closings: ['Best regards', 'Cheers', 'Thanks', 'Happy shopping', 'Take care'],
      urgency: ['Don\'t miss out', 'Act fast', 'Limited time', 'Hurry up', 'Time is running out']
    };
    
    result = result.replace(/Hi {{customer_name}}/g, `${variations.greetings[Math.floor(Math.random() * variations.greetings.length)]} {{customer_name}}`);
    result = result.replace(/Best regards/g, variations.closings[Math.floor(Math.random() * variations.closings.length)]);
    
    return result;
  }

  // Save email template
  async saveEmailTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        ...template,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving email template:', error);
      throw error;
    }

    return data;
  }

  // Save SMS template
  async saveSmsTemplate(template: Omit<SmsTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<SmsTemplate> {
    const { data, error } = await supabase
      .from('sms_templates')
      .insert({
        ...template,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving SMS template:', error);
      throw error;
    }

    return data;
  }

  // Get all email templates
  async getEmailTemplates(category?: string): Promise<EmailTemplate[]> {
    let query = supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching email templates:', error);
      throw error;
    }

    return data || [];
  }

  // Get all SMS templates
  async getSmsTemplates(category?: string): Promise<SmsTemplate[]> {
    let query = supabase
      .from('sms_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching SMS templates:', error);
      throw error;
    }

    return data || [];
  }

  // Create campaign
  async createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaign,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }

    return data;
  }

  // Get campaigns
  async getCampaigns(status?: string): Promise<Campaign[]> {
    let query = supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }

    return data || [];
  }

  // Create customer segment
  async createCustomerSegment(segment: Omit<CustomerSegment, 'id' | 'created_at'>): Promise<CustomerSegment> {
    const { data, error } = await supabase
      .from('customer_segments')
      .insert(segment)
      .select()
      .single();

    if (error) {
      console.error('Error creating customer segment:', error);
      throw error;
    }

    return data;
  }

  // Get customer segments
  async getCustomerSegments(): Promise<CustomerSegment[]> {
    const { data, error } = await supabase
      .from('customer_segments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer segments:', error);
      throw error;
    }

    return data || [];
  }

  // Preview email with variables
  async previewEmail(templateId: string, variables: Record<string, any>): Promise<string> {
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      throw error;
    }

    let content = template.content;
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return content;
  }

  // Preview SMS with variables
  async previewSms(templateId: string, variables: Record<string, any>): Promise<string> {
    const { data: template, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      throw error;
    }

    let content = template.content;
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return content;
  }
}

// Export a single instance of the service
export const emailSmsGenerator = new EmailSmsGeneratorService();
export const emailSmsGen = emailSmsGenerator;

