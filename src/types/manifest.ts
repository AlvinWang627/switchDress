export interface ChromeExtensionManifest {
  manifest_version: 3;
  name: string;
  version: string;
  description?: string;
  permissions: string[];
  optional_permissions?: string[];
  host_permissions?: string[];
  action?: {
    default_icon?: Record<string, string>;
    default_title?: string;
    default_popup?: string;
  };
  background?: {
    service_worker: string;
    type?: 'module';
  };
  content_scripts?: Array<{
    matches: string[];
    js?: string[];
    css?: string[];
    run_at?: 'document_start' | 'document_end' | 'document_idle';
  }>;
  icons?: Record<string, string>;
  options_page?: string;
  options_ui?: {
    page: string;
    open_in_tab?: boolean;
  };
}

export interface ExtensionConfig {
  manifestVersion: 3;
  name: string;
  version: string;
  description?: string;
}

export type Permission = 'storage' | 'tabs' | 'activeTab' | 'scripting' | string;
