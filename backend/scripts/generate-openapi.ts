import fs from 'node:fs';
import YAML from 'yaml';
import { createOpenApiDocument } from '../src/openapi/document';
fs.writeFileSync('openapi.yaml', YAML.stringify(createOpenApiDocument()), 'utf8');
