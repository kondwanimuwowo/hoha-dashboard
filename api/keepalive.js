export default async function handler(req, res) {
    const authHeader = req.headers['authorization']
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const url = process.env.VITE_SUPABASE_URL
    const key = process.env.VITE_SUPABASE_ANON_KEY

    if (!url || !key) {
        return res.status(500).json({ error: 'Missing Supabase credentials' })
    }

    try {
        const response = await fetch(`${url}/rest/v1/people?select=id&limit=1`, {
            headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
        })

        if (!response.ok) throw new Error(`Supabase responded with ${response.status}`)

        return res.status(200).json({ ok: true, timestamp: new Date().toISOString() })
    } catch (err) {
        return res.status(500).json({ error: err.message })
    }
}
