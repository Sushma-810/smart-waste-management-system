import pg from "pg";

const { Pool } = pg;

export const CATEGORIES = [
    "overflowing_bin",
    "illegal_dumping",
    "street_litter",
    "missed_collection"
];

export const STATUSES = [
    "submitted",
    "assigned",
    "in_progress",
    "resolved"
];

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
});

export const db = pool;

const BASE = `
    SELECT
        c.*,
        u.name AS user_name,
        u.email AS user_email
    FROM complaints c
    JOIN users u ON u.id = c.user_id
`;

function shape(r, history) {
    return {
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        status: r.status,
        location: r.location,
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
        imageUrl: r.image_url,
        assignedTo: r.assigned_to || "",
        createdAt: r.created_at,
        user: {
            name: r.user_name,
            email: r.user_email
        },
        history
    };
}

export async function findComplaints(where = "", params = []) {
    const result = await pool.query(
        `${BASE} ${where} ORDER BY c.created_at DESC, c.id DESC`,
        params
    );

    const rows = result.rows;

    const output = [];

    for (const r of rows) {
        const historyResult = await pool.query(
            `SELECT status, at
             FROM history
             WHERE complaint_id = $1
             ORDER BY id`,
            [r.id]
        );

        output.push(shape(r, historyResult.rows));
    }

    return output;
}

export async function findComplaint(id) {
    const complaints = await findComplaints(
        "WHERE c.id = $1",
        [id]
    );

    return complaints[0] || null;
}
