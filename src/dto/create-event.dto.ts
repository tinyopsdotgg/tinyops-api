import { EventType, ModType, ServerRegion, Game } from '@prisma/client'
import z from 'zod'

export const CreateEventSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	game: z.enum([Game.Arma3, Game.ArmaReforger]),
	startTimeUtc: z.string().datetime('Must be a valid ISO datetime string'),
	summary: z.string().min(1, 'Summary is required'),
	longDescription: z.string().min(1, 'Long description is required'),
	serverMap: z.string().min(1, 'Server map is required'),
	imageUrl: z.string().url('Must be a valid URL'),
	tags: z.array(z.string().min(1)).max(10, 'Maximum 10 tags allowed'),
	type: z.enum([EventType.PvE, EventType.PvP, EventType.PvPvE]),
	durationMinutes: z
		.number()
		.min(1, 'Duration must be at least 1 minute')
		.max(1440, 'Duration cannot exceed 24 hours'),
	modSizeMb: z.number().min(0, 'Mod size cannot be negative'),
	modType: z.enum([ModType.Vanilla, ModType.Modded]),
	serverName: z.string().min(1, 'Server name is required'),
	serverPassword: z.string().optional(),
	serverRegion: z.enum([ServerRegion.EU, ServerRegion.NA, ServerRegion.Other])
})

export type CreateEventDto = z.infer<typeof CreateEventSchema>
