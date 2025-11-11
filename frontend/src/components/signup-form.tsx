import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup>
            <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                    Fill in the form below to create your account
                </p>
            </div>
            <Field>
                <FieldLabel htmlFor="name">Business Name</FieldLabel>
                <Input id="name" type="text" placeholder="John Doe's Donuts Inc." required/>
            </Field>
            <Field>
                <FieldLabel htmlFor="email">Business Email</FieldLabel>
                <Input id="email" type="email" placeholder="m@example.com" required/>
                <FieldDescription>
                    We&apos;ll use this to contact you. We will not share your email
                    with anyone else.
                </FieldDescription>
            </Field>
            <Field>
                <FieldLabel htmlFor="number">Reward Point Rate</FieldLabel>
                <Input id="number" type="number" placeholder="10" required/>
            </Field>
            <FieldDescription>
                Set the number of points that a customer can earn per currency spent.
            </FieldDescription>

            <Field>
                <FieldLabel htmlFor="number">Number of Points for Reward</FieldLabel>
                <Input id="number" type="number" placeholder="15" required/>
            </Field>
            <FieldDescription>
                Set the number of points needed to redeem a reward.
            </FieldDescription>
            <Field>
                <FieldLabel htmlFor="number">Redemption Rate</FieldLabel>
                <Input id="number" type="number" step="0.01" placeholder="0.34" min="0.00" max="1.00" required/>
            </Field>
            <FieldDescription>
                Set the monetary value of one redemption.
            </FieldDescription>
            <Field>
                <FieldLabel htmlFor="url">Logo URL</FieldLabel>
                <Input id="url" type="url" placeholder="https://example.com/logo.png" required/>
            </Field>
            <FieldDescription>
                Enter the URL for your Business Logo.
            </FieldDescription>
            <FieldLabel htmlFor="color">Card Color</FieldLabel>
            <input id="myColorPicker" type="color" defaultValue="#00f7ff" />
            <FieldDescription>
                Set the color for your Loyalty passes.
            </FieldDescription>
            <FieldLabel htmlFor="color">Card Background Color</FieldLabel>
            <input type="color" id="myColorPicker" defaultValue="#00f7ff"/>
            <FieldDescription>
                Set the background color for your Loyalty passes.
            </FieldDescription>
            <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" type="password" required/>
                <FieldDescription>
                    Must be at least 8 characters long.
                </FieldDescription>
            </Field>
            <Field>
                <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                <Input id="confirm-password" type="password" required/>
                <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <Field>
                <Button type="submit">Create Account</Button>
                <FieldDescription className="px-6 text-center">
                    Already have an account? <a href="/login">Sign in</a>
                </FieldDescription>
            </Field>
        </FieldGroup>
    </form>
  )
}
