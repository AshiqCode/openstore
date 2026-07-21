// UI strings (English). Kept in one place for easy editing.

export type Strings = {
  appName: string;
  admin: string;
  loading: string;
  save: string;
  saving: string;
  saved: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  back: string;
  next: string;
  viewStore: string;

  addToCart: string;
  addedToCart: string;
  outOfStock: string;
  cart: string;
  cartEmpty: string;
  checkout: string;
  subtotal: string;
  total: string;
  delivery: string;
  qty: string;
  placeOrder: string;
  orderReceived: string;
  continueShopping: string;
  all: string;
  noProducts: string;
  productNotFound: string;
  orderSummary: string;
  welcomeBrowse: string;
  whatsappOpened: string;

  yourName: string;
  phone: string;
  address: string;
  fillAllFields: string;

  adminLogin: string;
  adminPanel: string;
  email: string;
  password: string;
  confirmPassword: string;
  login: string;
  logout: string;
  wrongPassword: string;
  dashboard: string;
  products: string;
  orders: string;
  settings: string;
  theme: string;
  config: string;
  changePassword: string;

  errNoConnection: string;
  errSaveFailed: string;
  errGeneric: string;
};

export const S: Strings = {
  appName: 'OPEN STORE',
  admin: 'admin',
  loading: 'Loading…',
  save: 'Save',
  saving: 'Saving…',
  saved: 'Saved',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  back: 'Back',
  next: 'Next',
  viewStore: 'View store',

  addToCart: 'Add to cart',
  addedToCart: 'Added to cart',
  outOfStock: 'Out of stock',
  cart: 'Cart',
  cartEmpty: 'Your cart is empty',
  checkout: 'Checkout',
  subtotal: 'Subtotal',
  total: 'Total',
  delivery: 'Delivery',
  qty: 'Qty',
  placeOrder: 'Place order',
  orderReceived: 'Order received!',
  continueShopping: 'Continue shopping',
  all: 'All',
  noProducts: 'No products yet. Add some from the admin panel.',
  productNotFound: 'Product not found.',
  orderSummary: 'Order summary',
  welcomeBrowse: 'Welcome — browse our products below.',
  whatsappOpened: 'WhatsApp opened — send the message to confirm your order.',

  yourName: 'Your name',
  phone: 'Phone',
  address: 'Delivery address',
  fillAllFields: 'Please fill name, phone and address.',

  adminLogin: 'Admin login',
  adminPanel: 'admin panel',
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Confirm password',
  login: 'Login',
  logout: 'Logout',
  wrongPassword: 'Wrong password',
  dashboard: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  settings: 'Settings',
  theme: 'Theme',
  config: 'Config',
  changePassword: 'Change password',

  errNoConnection: "Can't connect to Supabase — please re-check your keys.",
  errSaveFailed: "Couldn't save — please try again.",
  errGeneric: 'Something went wrong — please try again.',
};
