import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'cloud-store.json');

export interface CloudStoreData {
  activeConnection: {
    provider: 'aws' | 'azure' | null;
    connectedAt: string | null;
    accountId?: string;
    accountName?: string;
    region?: string;
    tenantId?: string;
  };
  aws: {
    accounts: Array<{ id: string; name: string; accountId: string; accountName: string; path: string }>;
    datasets: Record<string, any[]>;
  };
  azure: {
    accounts: Array<{ id: string; name: string; accountId: string; accountName: string; path: string }>;
    datasets: Record<string, any[]>;
    alerts: any[];
    meterBudgets: any[];
  };
  requests: any[];
  users: any[];
}

const DEFAULT_STORE: CloudStoreData = {
  activeConnection: {
    provider: null,
    connectedAt: null,
  },
  aws: {
    accounts: [],
    datasets: {},
  },
  azure: {
    accounts: [],
    datasets: {},
    alerts: [],
    meterBudgets: [],
  },
  requests: [],
  users: [
    {
      id: 1,
      email: 'dashboard-admin@coforge.com',
      name: 'System Admin',
      role: 'admin',
      department: 'Cloud Ops',
      password_hash: '$2b$10$YourStrongHashedPasswordHere',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ],
};

class CloudDataStore {
  private data: CloudStoreData = DEFAULT_STORE;

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        this.data = { ...DEFAULT_STORE, ...JSON.parse(raw) };
      }
    } catch (err: any) {
      console.warn('⚠️ Could not load data store from disk, using in-memory store:', err.message);
      this.data = { ...DEFAULT_STORE };
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('❌ Failed to save data store to disk:', err.message);
    }
  }

  public getActiveConnection() {
    return this.data.activeConnection;
  }

  public setActiveConnection(conn: CloudStoreData['activeConnection']) {
    this.data.activeConnection = conn;
    this.save();
  }

  public getAwsAccounts() {
    return this.data.aws.accounts;
  }

  public setAwsData(accounts: any[], datasets: Record<string, any[]>) {
    this.data.aws.accounts = accounts;
    this.data.aws.datasets = datasets;
    this.data.activeConnection = {
      provider: 'aws',
      connectedAt: new Date().toISOString(),
      accountId: accounts[0]?.accountId || 'AWS Account',
      accountName: accounts[0]?.name || 'AWS Account 1',
    };
    this.save();
  }

  public getAwsDataset(filename: string): any[] {
    const clean = filename.toLowerCase().replace(/\.csv$/, '').replace(/\.json$/, '');
    return this.data.aws.datasets[clean] || [];
  }

  public getAzureAccounts() {
    return this.data.azure.accounts;
  }

  public setAzureData(accounts: any[], datasets: Record<string, any[]>, alerts: any[] = [], meterBudgets: any[] = []) {
    this.data.azure.accounts = accounts;
    this.data.azure.datasets = datasets;
    this.data.azure.alerts = alerts;
    this.data.azure.meterBudgets = meterBudgets;
    this.data.activeConnection = {
      provider: 'azure',
      connectedAt: new Date().toISOString(),
      accountId: accounts[0]?.accountId || 'Azure Subscription',
      accountName: accounts[0]?.name || 'Azure Subscription 1',
    };
    this.save();
  }

  public getAzureDataset(filename: string): any[] {
    const clean = filename.toLowerCase().replace(/\.csv$/, '').replace(/\.json$/, '');
    return this.data.azure.datasets[clean] || [];
  }

  public getAzureAlerts(): any[] {
    return this.data.azure.alerts || [];
  }

  public getAzureMeterBudgets(): any[] {
    return this.data.azure.meterBudgets || [];
  }

  public addAzureMeterBudget(budget: any) {
    const id = Date.now();
    const newBudget = { id, ...budget, isActive: true, createdAt: new Date().toISOString() };
    this.data.azure.meterBudgets.push(newBudget);
    this.save();
    return newBudget;
  }

  public deleteAzureMeterBudget(id: number | string) {
    this.data.azure.meterBudgets = this.data.azure.meterBudgets.filter((b) => String(b.id) !== String(id));
    this.save();
  }

  // Requests
  public getRequests() {
    return this.data.requests || [];
  }

  public addRequest(req: any) {
    const newReq = {
      id: Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...req,
    };
    this.data.requests.unshift(newReq);
    this.save();
    return newReq;
  }

  public updateRequestStatus(id: number | string, status: string, reviewNotes?: string, reviewerEmail?: string) {
    const target = this.data.requests.find((r) => String(r.id) === String(id));
    if (target) {
      target.status = status;
      target.reviewNotes = reviewNotes || target.reviewNotes;
      target.reviewerEmail = reviewerEmail || target.reviewerEmail;
      target.updatedAt = new Date().toISOString();
      this.save();
      return target;
    }
    return null;
  }

  public deleteRequest(id: number | string) {
    this.data.requests = this.data.requests.filter((r) => String(r.id) !== String(id));
    this.save();
  }

  // Users
  public getUsers() {
    return this.data.users || [];
  }

  public findUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: any) {
    const newUser = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      is_active: true,
      ...user,
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public disconnect() {
    this.data.activeConnection = {
      provider: null,
      connectedAt: null,
    };
    this.save();
  }
}

export const store = new CloudDataStore();
export default store;
