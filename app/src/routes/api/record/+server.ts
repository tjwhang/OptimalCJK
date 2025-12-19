import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	
	console.log('UX Experiment Record:', data);
	
	// todo: save to DB here
	
	return json({ success: true });
};
