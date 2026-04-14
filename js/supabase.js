import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ismdncztwtubmgplzmim.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbWRuY3p0d3R1Ym1ncGx6bWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0Mzg1MjEsImV4cCI6MjA3NjAxNDUyMX0.pGP3b0T5FYJK2HPJU7aBz6ZY73fWnC728u03KKDGFSs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
