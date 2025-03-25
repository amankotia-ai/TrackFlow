# TrackFlow - UTM Tracking & Content Customization Platform

TrackFlow is an advanced marketing analytics platform that helps track UTM parameters, visualize user journeys, customize content based on traffic sources, and optimize campaign performance. It provides powerful tools for marketers to create dynamic experiences for their visitors based on where they come from.

## Key Features

### UTM Tracking & Analytics
- Comprehensive UTM parameter tracking and analysis
- Real-time traffic source identification
- Detailed campaign performance metrics
- Source attribution and conversion tracking
- User journey visualization and heatmaps

### Content Customization
- Rule-based content personalization based on UTM parameters
- Dynamic content swapping for different traffic sources
- A/B testing capabilities for marketing campaigns
- Content rule usage analytics
- Custom element targeting with CSS selectors

### Campaign Management
- Campaign creation and organization
- Performance tracking and ROI analysis
- Source-based campaign grouping
- Campaign comparison analytics
- Page-level performance insights

### Website Integration
- Easy-to-implement tracking scripts
- Webflow integration support
- Content customization script
- Journey tracking functionality
- Multiple integration options for different platforms

### Multi-tenant Architecture
- Support for multiple websites/domains
- Organization-level analytics
- Role-based access control
- Secure data segregation

## Tech Stack

TrackFlow is built with modern web technologies:

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn-ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Analytics**: Custom analytics engine with visualization tools

## Getting Started

### Prerequisites
- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account (for database and serverless functions)

### Installation

```sh
# Clone the repository
git clone https://github.com/amankotia-ai/TrackFlow.git

# Navigate to the project directory
cd TrackFlow

# Install the necessary dependencies
npm install

# Start the development server
npm run dev
```

### Setting Up Supabase
Check the migration files in `supabase/migrations/` for database schema setup.

## Script Integration

To integrate TrackFlow with your website, add the tracking script to your site's `<head>` section. Detailed integration instructions are available in the app's integration section after login.

## License

[MIT License](LICENSE)

## Contact

For questions or support, please open an issue in this repository.
