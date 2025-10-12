import z from 'zod'

export const RegisterUserSchema = z.object({
	username: z.string().min(4),
	password: z.string().min(8)
})

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>
