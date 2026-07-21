// i18n string tables. English is the default; the user can switch to Urdu via
// the language toggle (see components/LanguageProvider.tsx). Add a language by
// adding another entry to `translations` with the same keys.

export type Lang = 'en' | 'roman' | 'ur';
export const DEFAULT_LANG: Lang = 'en';
export const LANG_KEY = 'store_lang';

export const LANGUAGES: { code: Lang; label: string; native: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English', native: 'English', dir: 'ltr' },
  { code: 'roman', label: 'Roman Urdu', native: 'Roman Urdu', dir: 'ltr' },
  { code: 'ur', label: 'Urdu', native: 'اردو', dir: 'rtl' },
];

// The shape every language must provide. `appName` is the brand — same in all.
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
  language: string;

  // Store
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

  // Checkout form
  yourName: string;
  phone: string;
  address: string;
  fillAllFields: string;

  // Admin
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

  // Errors
  errNoConnection: string;
  errSaveFailed: string;
  errGeneric: string;
  changePwBanner: string;
};

export const translations: Record<Lang, Strings> = {
  en: {
    appName: 'DukaanKit',
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
    language: 'Language',

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
    changePwBanner: "You're still using the default password (666). Change it now.",
  },
  roman: {
    appName: 'DukaanKit',
    admin: 'admin',
    loading: 'Load ho raha hai…',
    save: 'Save karein',
    saving: 'Save ho raha hai…',
    saved: 'Save ho gaya',
    cancel: 'Cancel',
    delete: 'Delete karein',
    edit: 'Edit karein',
    add: 'Add karein',
    back: 'Wapas',
    next: 'Agay',
    viewStore: 'Store dekhein',
    language: 'Zabaan',

    addToCart: 'Cart mein daalein',
    addedToCart: 'Cart mein add ho gaya',
    outOfStock: 'Stock khatam',
    cart: 'Cart',
    cartEmpty: 'Aapka cart khaali hai',
    checkout: 'Order mukammal karein',
    subtotal: 'Subtotal',
    total: 'Total',
    delivery: 'Delivery',
    qty: 'Tadaad',
    placeOrder: 'Order dein',
    orderReceived: 'Order mil gaya!',
    continueShopping: 'Khareedari jaari rakhein',
    all: 'Sab',
    noProducts: 'Abhi koi product nahi. Admin panel se add karein.',
    productNotFound: 'Product nahi mila.',
    orderSummary: 'Order ki tafseel',
    welcomeBrowse: 'Khush aamdeed — neeche hamare products dekhein.',
    whatsappOpened: 'WhatsApp khul gaya — order confirm karne ke liye message bhejein.',

    yourName: 'Aapka naam',
    phone: 'Phone number',
    address: 'Delivery ka pata',
    fillAllFields: 'Meharbani kar ke naam, phone aur pata bharein.',

    adminLogin: 'Admin login',
    adminPanel: 'admin panel',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Password confirm karein',
    login: 'Login',
    logout: 'Logout',
    wrongPassword: 'Ghalat password',
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    settings: 'Settings',
    theme: 'Theme',
    config: 'Config',
    changePassword: 'Password tabdeel karein',

    errNoConnection: 'Supabase se connection nahi ho raha — apni keys dobara check karein.',
    errSaveFailed: 'Save nahi hua — dobara koshish karein.',
    errGeneric: 'Kuch ghalat ho gaya — dobara koshish karein.',
    changePwBanner: 'Aap abhi tak default password (666) use kar rahe hain. Abhi tabdeel karein.',
  },
  ur: {
    appName: 'DukaanKit',
    admin: 'ایڈمن',
    loading: 'لوڈ ہو رہا ہے…',
    save: 'محفوظ کریں',
    saving: 'محفوظ ہو رہا ہے…',
    saved: 'محفوظ ہو گیا',
    cancel: 'منسوخ',
    delete: 'حذف کریں',
    edit: 'تبدیل کریں',
    add: 'شامل کریں',
    back: 'واپس',
    next: 'آگے',
    viewStore: 'اسٹور دیکھیں',
    language: 'زبان',

    addToCart: 'کارٹ میں ڈالیں',
    addedToCart: 'کارٹ میں شامل ہو گیا',
    outOfStock: 'ختم',
    cart: 'کارٹ',
    cartEmpty: 'آپ کا کارٹ خالی ہے',
    checkout: 'آرڈر مکمل کریں',
    subtotal: 'ذیلی کل',
    total: 'کل',
    delivery: 'ڈیلیوری',
    qty: 'تعداد',
    placeOrder: 'آرڈر دیں',
    orderReceived: 'آرڈر مل گیا!',
    continueShopping: 'خریداری جاری رکھیں',
    all: 'سب',
    noProducts: 'ابھی کوئی پروڈکٹ نہیں۔ ایڈمن پینل سے شامل کریں۔',
    productNotFound: 'پروڈکٹ نہیں ملا۔',
    orderSummary: 'آرڈر کی تفصیل',
    welcomeBrowse: 'خوش آمدید — نیچے ہمارے پروڈکٹس دیکھیں۔',
    whatsappOpened: 'واٹس ایپ کھل گیا — آرڈر کنفرم کرنے کے لیے میسج بھیجیں۔',

    yourName: 'آپ کا نام',
    phone: 'فون نمبر',
    address: 'ڈیلیوری کا پتہ',
    fillAllFields: 'براہ کرم نام، فون اور پتہ بھریں۔',

    adminLogin: 'ایڈمن لاگ اِن',
    adminPanel: 'ایڈمن پینل',
    email: 'ای میل',
    password: 'پاس ورڈ',
    confirmPassword: 'پاس ورڈ کی تصدیق',
    login: 'لاگ اِن',
    logout: 'لاگ آؤٹ',
    wrongPassword: 'غلط پاس ورڈ',
    dashboard: 'ڈیش بورڈ',
    products: 'پروڈکٹس',
    orders: 'آرڈرز',
    settings: 'سیٹنگز',
    theme: 'تھیم',
    config: 'کنفگ',
    changePassword: 'پاس ورڈ تبدیل کریں',

    errNoConnection: 'Supabase سے کنکشن نہیں ہو رہا — اپنی keys دوبارہ چیک کریں۔',
    errSaveFailed: 'محفوظ نہیں ہوا — دوبارہ کوشش کریں۔',
    errGeneric: 'کچھ غلط ہو گیا — دوبارہ کوشش کریں۔',
    changePwBanner: 'آپ ابھی تک ڈیفالٹ پاس ورڈ (666) استعمال کر رہے ہیں۔ ابھی تبدیل کریں۔',
  },
};

export function getStrings(lang: Lang): Strings {
  return translations[lang] ?? translations[DEFAULT_LANG];
}

// English default set, for the rare module-scope/static fallback.
export const S = translations.en;
