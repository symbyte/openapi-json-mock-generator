import { faker } from '@faker-js/faker';
import { OpenAPIV3 } from 'openapi-types';
import { CLIOptions } from './cli';

export type JsonCompatiblePrimitive = string | number | boolean;

export function transformJSONSchemaToFakerJson(
  options: CLIOptions,
  jsonSchema?: OpenAPIV3.SchemaObject,
  key?: string,
): JsonCompatiblePrimitive {
  if (!jsonSchema) {
    return '{}';
  }

  if (jsonSchema.example) {
    return JSON.stringify(jsonSchema.example);
  }

  if (jsonSchema.enum) {
    return `"${faker.helpers.arrayElement(jsonSchema.enum)}"`;
  }

  switch (jsonSchema.type) {
    case 'string':
      return `"${transformStringBasedOnFormat(jsonSchema.format, key)}"`;
    case 'number':
      return faker.number.float({min: 0, max: 50, fractionDigits: 2 });
    case 'integer':
      return faker.number.int({min: 0, max: 50000 });
    case 'boolean':
      return faker.datatype.boolean();
    case 'object':
      if (
        !jsonSchema.properties &&
        typeof jsonSchema.additionalProperties === 'object'
      ) {
        const keys = [...new Array(Number(options.maxArrayLength)).keys()];
        const result = `{${keys.map(
          (index) =>
            `"${faker.lorem.word()}-${index}": ${transformJSONSchemaToFakerJson(
              options,
              jsonSchema.additionalProperties as OpenAPIV3.SchemaObject,
            )}`,
        )}}`;
        return result;
      }

      return `{${Object.entries(jsonSchema.properties ?? {})
        .map(([k, v]) => {
          return `${JSON.stringify(k)}: ${transformJSONSchemaToFakerJson(
            options,
            v as OpenAPIV3.SchemaObject,
            k,
          )}`;
        })
        .join(',\n')}}`;
    case 'array':
      return (
        '[' +
        [
          ...new Array(
            faker.number.int({ max: options.maxArrayLength, min: 10 }),
          ).keys(),
        ].map((_) =>
          transformJSONSchemaToFakerJson(
            options,
            jsonSchema.items as OpenAPIV3.SchemaObject,
          ),
        ) +
        ']'
      );
    default:
      return 'null';
  }
}

/**
 * See https://json-schema.org/understanding-json-schema/reference/string.html#built-in-formats
 */
function transformStringBasedOnFormat(format?: string, key?: string) {
  if (
    ['date-time', 'date', 'time'].includes(format ?? '') ||
    key?.toLowerCase().endsWith('_at')
  ) {
    return faker.date.past({ refDate: new Date('01/01/2020').toUTCString() }).toUTCString();
  } else if (format === 'uuid') {
    return faker.string.uuid();
  } else if (
    ['idn-email', 'email'].includes(format ?? '') ||
    key?.toLowerCase().endsWith('email')
  ) {
    return faker.internet.email();
  } else if (['hostname', 'idn-hostname'].includes(format ?? '')) {
    return faker.internet.domainName();
  } else if (format === 'ipv4') {
    return faker.internet.ip();
  } else if (format === 'ipv6') {
    return faker.internet.ipv6();
  } else if (
    ['uri', 'uri-reference', 'iri', 'iri-reference', 'uri-template'].includes(
      format ?? '',
    ) ||
    key?.toLowerCase().endsWith('url')
  ) {
    return faker.internet.url();
  } else if (key?.toLowerCase().endsWith('name')) {
    return faker.person.fullName();
  } else {
    return faker.lorem.slug(1);
  }
}
