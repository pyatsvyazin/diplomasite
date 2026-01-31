/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/about', destination: '/about/aboutPage' },
      { source: '/cases', destination: '/cases/casesPage' },
      { source: '/news', destination: '/news/newsPage' },
      { source: '/reviews', destination: '/reviews/reviewsPage' },
      { source: '/contacts', destination: '/contacts/contactsPage' },
      { source: '/profile', destination: '/profile/profilePage' },
      { source: '/settings', destination: '/settings/settingsPage' },
      { source: '/chats', destination: '/chats/chatsPage' },
    ];
  },
};

module.exports = nextConfig;
