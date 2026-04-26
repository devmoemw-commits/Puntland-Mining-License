

const config = {
    env: {
      apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT!,
      nextAuthSecret: process.env.NEXTAUTH_SECRET!,
      apiSecretKey: process.env.API_SECRET_KEY!,
      imagekit: {
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
      },
      databaseUrl: process.env.DATABASE_URL!,
    },
  };
  
  export default config;