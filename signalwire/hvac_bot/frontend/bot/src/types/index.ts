export interface Company {
  name: string;
  description: string;
}

export interface ContactReason {
  id: string;
  title: string;
  description: string;
  gather: Gather[];
} 

export interface ContactReasons {
  contactReasons: ContactReason[];
}

export interface Gather {
  type: string;
  name: string;
  label: string;
  description: string;
}