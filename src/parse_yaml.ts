import yaml from 'js-yaml';
import fs from 'fs';

export type Section = {
  name?: string;
  extends?: string[];
  file_mappings?: Record<string, string>;
  substitutions?: Record<string, string>;
  [key: string]: any;
};

function parseYamlFromFile(filename: string): Record<string, Section> {
  const yamlString = fs.readFileSync(filename, 'utf-8');
  return yaml.load(yamlString) as Record<string, Section>;
};

const resolveExtends = (data: Record<string, Section>) => {
  const arrayToObject = (arr?: Record<string, string>[]) => {
    return arr ? Object.assign({}, ...arr) : {};
  };

  const resolveSection = (section: Section): Section => {
    if (Object.prototype.toString.call(section.substitutions) === '[object Array]') {
      section.substitutions = arrayToObject(section.substitutions as any);
    }
    if (Object.prototype.toString.call(section.file_mappings) === '[object Array]') {
      section.file_mappings = arrayToObject(section.file_mappings as any);
    }
    if (!section.extends) { return section; }
    let merged: Section = { ...section };
    for (const ext of section.extends) {
      if (data[ext]) {
        const base = resolveSection(data[ext]);
        merged = {
          ...base,
          ...merged,
        };
        if (base.file_mappings) {
          merged = { ...merged, file_mappings: { ...base.file_mappings, ...merged.file_mappings } };
        }
        if (base.substitutions) {
          merged = { ...merged, substitutions: { ...base.substitutions, ...merged.substitutions } };
        }
      }
    }
    delete merged.extends;
    return merged;
  };

  const traverseSections = (obj: Section) => {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'object') {
        obj[key] = resolveSection(obj[key]);
        if (key !== "file_mappings" && key !== "substitutions") {
          if (obj.file_mappings) {
            obj[key] = { ...obj[key], file_mappings: { ...obj[key].file_mappings, ...obj.file_mappings } };
          }
          if (obj.substitutions) {
            obj[key] = { ...obj[key], substitutions: { ...obj[key].substitutions, ...obj.substitutions } };
          }
        }
        traverseSections(obj[key]);
      }
    });
  };

  traverseSections(data);
};


export function processYamlFile(filename: string): Record<string, Section> {
  const data = parseYamlFromFile(filename);
  resolveExtends(data);
  for (const key in data) {
    if (key.at(0) === ".") {
      delete data[key];
    }
  }
  return data;
};


