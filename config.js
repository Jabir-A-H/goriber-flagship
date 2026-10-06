/**
 * GORIBER FLAGSHIP (গরিবের ফ্ল্যাগশিপ) - Configuration
 */

const APP_CONFIG = {
  // Brand Details
  shopName: "Goriber Flagship",
  shopNameBengali: "গরিবের ফ্ল্যাগশিপ",
  tagline: "ন্যায্য দামে, উচ্চ গুণে, গরীবের ফ্ল্যাগশিপ সবার প্রাণে",

  // Contact Information
  whatsapp: "+8801410405664",
  whatsappDisplay: "01410-405664",
  facebookUrl: "https://www.facebook.com/GoriberFlagship/",

  // Live Google Sheet Source (Official Production Sheet)
  googleSheetUrl: "https://docs.google.com/spreadsheets/d/17qY32Y8GDPWVZ9YfjyIRvItH0nFhsr6CJDxYBqkvuVg/edit",
  googleSheetId: "17qY32Y8GDPWVZ9YfjyIRvItH0nFhsr6CJDxYBqkvuVg",

  // Default View: 'list' (Product Cards) or 'sheet' (Live Sheet View)
  defaultView: "list",

  // Customer Announcement
  notice: "🔥 দাম ও স্টক প্রতিনিয়ত পরিবর্তনশীল। যেকোনো ফোনের বর্তমান অফার ও স্টক জানতে সরাসরি হোয়াটসঅ্যাপে মেসেজ দিন!"
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}
