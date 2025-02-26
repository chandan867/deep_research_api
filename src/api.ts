// src/api.ts
import express, { Request, Response } from 'express';
// import * as fs from 'fs/promises';
import { deepResearch, writeFinalReport } from './deep-research';
import { generateFeedback } from './feedback';

const app = express();
const port = 3000; // You can choose a different port

app.use(express.json()); // Middleware to parse JSON request bodies

app.post('/research', async(req:Request,res:Response)=> {
  const { initialQuery, breadth, depth, followUpAnswers } = req.body;

  if (!initialQuery || breadth === undefined || depth === undefined) {
    return res.status(400).send({ error: 'Missing required parameters: initialQuery, breadth, depth' });
  }

  try {
    console.log(`Starting research for query: ${initialQuery}, breadth: ${breadth}, depth: ${depth}`);

    let combinedQuery = `Initial Query: ${initialQuery}`;
    if (followUpAnswers && Array.isArray(followUpAnswers)) {
      const followUpQuestions = await generateFeedback({ query: initialQuery });
      combinedQuery += `\nFollow-up Questions and Answers:\n${followUpQuestions.map((q: string, i: number) => `Q: ${q}\nA: ${followUpAnswers[i] || 'No Answer Provided'}`).join('\n')}`;
    }

    const { learnings, visitedUrls } = await deepResearch({
      query: combinedQuery,
      breadth: breadth,
      depth: depth,
      onProgress: (progress) => {
        // We are removing terminal progress for API, can log if needed for debugging
        // console.log('Research Progress:', progress);
      },
    });

    console.log('Learnings:', learnings);
    console.log('Visited URLs:', visitedUrls);

    const report = await writeFinalReport({
      prompt: combinedQuery,
      learnings,
      visitedUrls,
    });

    // For API, instead of saving to file, we send it in the response
    // await fs.writeFile('output.md', report, 'utf-8'); // No longer needed for API

    res.status(200).json({
      reportMarkdown: report,
      learnings: learnings,
      visitedUrls: visitedUrls,
    });

  } catch (error: any) {
    console.error('Research failed:', error);
    res.status(500).send({ error: 'Research process failed', details: error.message });
  }
});

app.get('/',(req: Request, res: Response) => {
  res.status(200).send({"message":'Deep Research API is running. Use POST /research to start research.'});
});

app.listen(port, () => {
  console.log(`Deep Research API listening at http://localhost:${port}`);
});