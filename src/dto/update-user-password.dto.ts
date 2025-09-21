import z from 'zod'

export const UpdateUserPasswordSchema = z.object({
	currentPassword: z.string(),
	newPassword: z.string()
})

export type UpdateUserPasswordDto = z.infer<typeof UpdateUserPasswordSchema>
