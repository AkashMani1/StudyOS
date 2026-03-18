interface RazorpayCheckoutOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  theme?: {
    color?: string;
  };
  handler?: (response: { razorpay_subscription_id?: string }) => void;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayInstance;
}

interface Window {
  Razorpay?: RazorpayConstructor;
}
