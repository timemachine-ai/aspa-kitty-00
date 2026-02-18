import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Notes AI Co-pilot API ──────────────────────────────────────────
// Dedicated endpoint for the notes page AI assistant.
// Receives the full note context (title + blocks with indices) and
// a user instruction, then returns structured JSON edits.

const SYSTEM_PROMPT = `You are the TimeMachine Notes AI Co-pilot. You help users edit, enhance, and manage their notes.

## Context Format
You will receive the full note context with:
- Note title
- All blocks, each with: index (position), id, type, and content

## Your Job
When the user asks you to edit, enhance, complete, fix, rewrite, or otherwise modify note content, you must:
1. Identify which block(s) need to change based on the user's instruction.
2. Return ONLY a valid JSON object (no markdown fences, no extra text) with your edits.

## Response Format
Always respond with this exact JSON structure:
{
  "edits": [
    {
      "blockId": "the_block_id",
      "newContent": "the updated content for this block",
      "newType": "text"
    }
  ],
  "newBlocks": [
    {
      "afterBlockId": "id_of_block_to_insert_after",
      "type": "text",
      "content": "content of the new block"
    }
  ],
  "message": "A brief explanation of what you changed"
}

## Field Details
- edits: Array of blocks to modify. Each entry needs the blockId and the new content. Only include newType if the block type should change (e.g. from "text" to "heading1").
- newBlocks: Array of new blocks to insert. afterBlockId is the id of the existing block after which the new block should be placed. Use "START" to insert at the very beginning.
- message: A short, friendly summary of what you did (1-2 sentences).

## Rules
1. ONLY output the JSON object. No markdown code fences. No explanation text outside the JSON.
2. Preserve content you were NOT asked to change. Only include blocks in "edits" that you actually modified.
3. If the user asks to "enhance" or "improve" a block, make it better while keeping the same voice and intent.
4. If the user asks to "complete" something, finish the thought/sentence/paragraph naturally.
5. If the user says something vague like "make it better" or "fix this", apply improvements to the block that is most likely the target (usually the last non-empty block, or infer from context).
6. For new content the user wants added, use "newBlocks" instead of editing existing blocks.
7. Always preserve the original block type unless the user explicitly wants it changed.
8. Keep the "message" field concise and natural.

## Block Types Available
text, heading1, heading2, heading3, bullet-list, numbered-list, todo, quote, code, divider, callout

## Examples

User: "Make the second paragraph more professional"
Context has block index 1 (id: "abc") with casual text.
Response:
{"edits":[{"blockId":"abc","newContent":"The refined professional version of the text..."}],"newBlocks":[],"message":"Made the second paragraph more professional and polished."}

User: "Add a summary at the end"
Last block id is "xyz".
Response:
{"edits":[],"newBlocks":[{"afterBlockId":"xyz","type":"text","content":"In summary, ..."}],"message":"Added a summary at the end of your note."}

User: "Convert the third block to a heading"
Block index 2 (id: "def") is a text block.
Response:
{"edits":[{"blockId":"def","newContent":"Same content","newType":"heading2"}],"newBlocks":[],"message":"Converted the third block to a heading."}`;

async function callCerebrasAPI(messages: any[]): Promise<string> {
  const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
  if (!CEREBRAS_API_KEY) {
    throw new Error('CEREBRAS_API_KEY not configured');
  }

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-oss-120b',
      messages,
      temperature: 0.4,
      max_completion_tokens: 4000,
      top_p: 1,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cerebras API Error (Notes AI):', errorText);
    throw new Error(`Cerebras API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

interface BlockContext {
  index: number;
  id: string;
  type: string;
  content: string;
  checked?: boolean;
}

function buildNoteContext(title: string, blocks: BlockContext[]): string {
  let context = `## Note Title: ${title || 'Untitled'}\n\n## Blocks:\n`;
  for (const block of blocks) {
    const checkedStr = block.type === 'todo' ? ` [${block.checked ? 'x' : ' '}]` : '';
    context += `[Block ${block.index}] (id: "${block.id}", type: "${block.type}")${checkedStr}\n`;
    if (block.type === 'divider') {
      context += `---\n`;
    } else {
      context += `${block.content || '(empty)'}\n`;
    }
    context += `\n`;
  }
  return context;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, blocks, instruction } = req.body;

    if (!blocks || !Array.isArray(blocks) || !instruction) {
      return res.status(400).json({ error: 'Missing required fields: blocks, instruction' });
    }

    const noteContext = buildNoteContext(title || '', blocks);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Here is the current note:\n\n${noteContext}\n\nUser instruction: ${instruction}`,
      },
    ];

    const aiResponse = await callCerebrasAPI(messages);

    // Parse the JSON response from the AI
    // Strip markdown code fences if the model wraps them
    let cleaned = aiResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Notes AI error:', error);

    // If JSON parse failed, return a friendly error
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        error: 'AI returned an invalid response. Please try again.',
        edits: [],
        newBlocks: [],
        message: 'Something went wrong, please try again.',
      });
    }

    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
