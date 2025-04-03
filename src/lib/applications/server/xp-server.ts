import LocalProvider from "../pglite/base";
import { SupabaseProvider } from "../supabase/server";

class XpServer {
  private localProvider = new LocalProvider();
  private supabaseProvider = new SupabaseProvider();

  async signOut() {
    return await this.supabaseProvider.signOut();
  }
}

const xpServer = new XpServer();

export default xpServer;
