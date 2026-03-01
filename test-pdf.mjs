import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://etpehiyzlkhknzceizar.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPdfInsert() {
  const documentId = 'test-doc-' + Date.now();
  const chunks = ['This is a test chunk 1', 'This is a test chunk 2'];

  const rows = chunks.map((content, index) => ({
    document_id: documentId,
    user_id: 'test-user',
    chunk_index: index,
    content,
    page_count: null,
    file_name: 'test.pdf'
  }));

  console.log('Attempting to insert:', rows.length, 'rows');
  const { data, error } = await supabase.from('pdf_chunks').insert(rows).select();

  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert succeeded:', data.length, 'rows');

    // Test search
    const { data: searchData, error: searchError } = await supabase.rpc('search_pdf_chunks', {
      p_document_id: documentId,
      p_query: 'chunk 1',
      p_limit: 5
    });

    console.log('Search RPC returned:', searchError || searchData);

    // Cleanup
    await supabase.from('pdf_chunks').delete().eq('document_id', documentId);
    console.log('Cleanup done');
  }
}

testPdfInsert().catch(console.error);
