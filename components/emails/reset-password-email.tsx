import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components"

interface ResetPasswordEmailProps {
  resetLink: string
  userName?: string
}

export const ResetPasswordEmail = ({ resetLink, userName = "there" }: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Password Reset</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            Someone requested a password reset for your account. If this was you, you can reset your password through
            the button below.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetLink}>
              Reset Password
            </Button>
          </Section>
          <Text style={text}>
           {` If you didn't request this, you can safely ignore this email - your password will not be changed.`}
          </Text>
          <Text style={text}>This link will expire in 1 hour for security reasons.</Text>
          <Hr style={hr} />
          <Text style={footer}>
            {` If the button above doesn't work, copy and paste this URL into your web browser`}
            <Link href={resetLink} style={link}>
              {resetLink}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: "60px 0",
}

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e0e0e0",
  borderRadius: "5px",
  margin: "0 auto",
  padding: "40px",
  maxWidth: "600px",
}

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 20px",
}

const text = {
  color: "#444",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 20px",
}

const buttonContainer = {
  margin: "30px 0",
}

const button = {
  backgroundColor: "#0070f3",
  borderRadius: "5px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "12px 20px",
  textDecoration: "none",
}

const hr = {
  borderColor: "#e0e0e0",
  margin: "30px 0",
}

const footer = {
  color: "#777",
  fontSize: "14px",
  lineHeight: "22px",
}

const link = {
  color: "#0070f3",
  textDecoration: "underline",
}
