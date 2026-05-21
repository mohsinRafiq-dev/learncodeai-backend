// Pre-generated tutorials. Each language has a full beginner→expert curriculum
// (24 tutorials, 4 modules) in its own file under seedData/.

import pythonTutorials from './seedData/pythonTutorials.js';
import javascriptTutorials from './seedData/javascriptTutorials.js';
import cppTutorials from './seedData/cppTutorials.js';

// Distinct concept list per language, derived from the curriculum file.
// Used by the frontend's main concepts API and onboarding flows.
const distinctConcepts = (tutorials) =>
  Array.from(new Set(tutorials.map((t) => t.concept)));

export const mainConcepts = {
  python: distinctConcepts(pythonTutorials),
  javascript: distinctConcepts(javascriptTutorials),
  cpp: distinctConcepts(cppTutorials),
};

export const preGeneratedTutorials = [
  ...pythonTutorials,
  ...javascriptTutorials,
  ...cppTutorials,
];

export default preGeneratedTutorials;
