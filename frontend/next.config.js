/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap' },
      { source: '/about', destination: '/about/aboutPage' },
      { source: '/cases', destination: '/' },
      { source: '/news', destination: '/news/newsPage' },
      { source: '/reviews', destination: '/reviews/reviewsPage' },
      { source: '/contacts', destination: '/contacts/contactsPage' },
      { source: '/profile', destination: '/profile/profilePage' },
      { source: '/settings', destination: '/settings/settingsPage' },
      { source: '/chats', destination: '/chats/chatsPage' },
      { source: '/conversations', destination: '/chats/chatsPage' },
    ];
  },
};

module.exports = nextConfig;
