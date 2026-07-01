import YAML from 'yaml';
import { createOpenApiDocument } from '@/openapi/document';
export async function GET() { return new Response(YAML.stringify(createOpenApiDocument()), { headers: { 'content-type': 'application/yaml; charset=utf-8' } }); }
