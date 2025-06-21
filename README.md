## Authentication

This project uses Supabase Auth with support for:
- Email/Password authentication
- Google OAuth
- Microsoft OAuth (Azure AD)
- GitHub OAuth

### Setting up Microsoft OAuth

To enable Microsoft sign-in, you'll need to:
1. Register your application in Azure Active Directory
2. Configure the OAuth settings in Supabase
3. Add the required environment variables

See `docs/microsoft-oauth-setup.md` for detailed setup instructions.
