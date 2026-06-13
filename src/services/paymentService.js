// Dummy payment service — replace with Razorpay / Stripe integration

export const initiatePayment = async ({ amount, orderId }) => {
  await delay(1000);
  return {
    success: true,
    transactionId: `TXN-${Date.now()}`,
    amount,
    orderId,
    method: 'UPI',
    message: 'Payment successful (simulated)',
  };
};

export const getPaymentMethods = async () => {
  await delay(200);
  return [
    { id: 'upi', label: 'UPI', icon: '📱' },
    { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
    { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
  ];
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
