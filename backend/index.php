<?php

use BcMath\Number;
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE, GET, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type");

$host = "localhost";
$port = "5432";
$dbname = "kp6_test";
$user = "postgres";
$password = "";

$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");
if (!$conn) die("Connecting to PostgreSQL error");
pg_set_client_encoding($conn, "UTF8");

pg_query($conn,
"CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    image_data BYTEA NOT NULL
);");

pg_query($conn,
"CREATE TABLE IF NOT EXISTS options (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK(id = 1),
    column_width SMALLINT NOT NULL,
    gutter SMALLINT NOT NULL
);");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    if ($action === 'upload_image') {
        $input = file_get_contents(filename: 'php://input');
        $data = json_decode($input, true);

        if (isset($data['image']) && is_string($data['image'])) {
            if (preg_match('/^data:image\/(\w+);base64,/', $data['image'], $matches)) {
                $base64_data = substr($data['image'], strpos($data['image'], ',') + 1);
                $file_data = base64_decode($base64_data);

                if ($file_data === false) {
                    echo json_encode([
                        'success' => false,
                        'error' => 'Invalid base64 data'
                    ]);
                    exit;
                }

                $escaped_data = pg_escape_bytea($file_data);

                $result = pg_query_params($conn, "INSERT INTO images (image_data) VALUES ($1) RETURNING id", [$escaped_data]);

                if ($result) {
                    $row = pg_fetch_assoc($result);
                    echo json_encode([
                        'success' => true,
                        'id' => (int) $row['id']
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'error' => pg_last_error($conn)
                    ]);
                }
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid data URL format'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'No image data provided'
            ]);
        }
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $action = $_GET['action'] ?? '';
    if ($action === 'delete_image') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;

        if ($id === null) {
            http_response_code(400);
            echo json_encode(["error" => "Missing image ID"]);
            exit;
        }

        $result = pg_query_params($conn, "DELETE FROM images WHERE id = $1", [$id]);

        if ($result && pg_affected_rows($result) > 0) {
            echo json_encode(value: [
                "success" => true, 
                "message" => "Image deleted"
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Image not found"]);
        }
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'get_all_images') {
        $result = pg_query($conn, "SELECT id, image_data FROM images;");

        if (!$result) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to fetch images"]);
            exit;
        }

        $images = [];
        while ($row = pg_fetch_assoc($result)) {
            $binary = pg_unescape_bytea($row['image_data']); 
            $images[] = [
                "id" => (int) $row["id"],
                "image" => "data:image/png;base64," . base64_encode($binary)
            ];
        }

        echo json_encode($images);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    if ($action === 'get_options') {
        $result = pg_query($conn, "SELECT column_width, gutter FROM options WHERE id = 1;");

        if (!$result) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to fetch options"]);
            exit;
        }

        $row = pg_fetch_assoc($result);
        echo json_encode(value: [
            "columnWidth" => (int) $row["column_width"],
            "gutter" => (int) $row["gutter"],
        ]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $action = $_GET['action'] ?? '';
    if ($action === 'change_options') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        $column_width = isset($data['columnWidth']) ? (int)$data['columnWidth'] : null;
        $gutter = isset($data['gutter']) ? (int)$data['gutter'] : null;

        if ($column_width === null || $gutter === null) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing fields"]);
            exit;
        }

        $query = "UPDATE options SET column_width = $1, gutter = $2 WHERE id = 1";

        $result = pg_query_params($conn, $query, [$column_width, $gutter]);

        if ($result) {
            echo json_encode(["success" => true, "message" => "Options updated"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error"]);
        }
    }
}
