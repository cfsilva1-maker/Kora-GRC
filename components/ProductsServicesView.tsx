
import React, { useState } from 'react';
import { Vendor, Service } from '../types';
import { Package, Plus, Trash2, Edit2, Search, Server, ShieldAlert, Users, Filter } from 'lucide-react';
import Modal from './Modal';

interface ProductsServicesViewProps {
  vendors: Vendor[];
  onUpdateVendor: (vendor: Vendor) => void;
}

const ProductsServicesView: React.FC<ProductsServicesViewProps> = ({ vendors, onUpdateVendor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
      criticality: [] as string[]
  });

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Service> & { vendorId: string }>({
    vendorId: '',
    name: '',
    description: '',
    criticality: 'Operational',
    owner: '',
    sla: ''
  });

  const toggleFilter = (value: string) => {
    setFilters(prev => {
        const current = prev.criticality;
        const updated = current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value];
        return { ...prev, criticality: updated };
    });
  };

  const clearFilters = () => {
      setFilters({ criticality: [] });
      setSearchTerm('');
  };

  // Flatten services for the view
  const allServices = vendors.flatMap(v => 
    v.services.map(s => ({ ...s, vendorName: v.name, vendorId: v.id }))
  ).filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCriticality = filters.criticality.length === 0 || filters.criticality.includes(s.criticality);

    return matchesSearch && matchesCriticality;
  });

  const activeFilterCount = filters.criticality.length;

  const handleOpenModal = (service?: Service & { vendorId: string }) => {
    if (service) {
      setEditingId(service.id);
      setFormData({
        vendorId: service.vendorId,
        name: service.name,
        description: service.description,
        criticality: service.criticality,
        owner: service.owner,
        sla: service.sla
      });
    } else {
      setEditingId(null);
      setFormData({
        vendorId: vendors.length > 0 ? vendors[0].id : '',
        name: '',
        description: '',
        criticality: 'Operational',
        owner: '',
        sla: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (vendorId: string, serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        const updatedVendor = {
          ...vendor,
          services: vendor.services.filter(s => s.id !== serviceId)
        };
        onUpdateVendor(updatedVendor);
      }
    }
  };

  const handleSave = () => {
    if (!formData.vendorId || !formData.name) return;

    const vendor = vendors.find(v => v.id === formData.vendorId);
    if (!vendor) return;

    let updatedVendor: Vendor;

    if (editingId) {
      updatedVendor = {
        ...vendor,
        services: vendor.services.map(s => 
          s.id === editingId 
            ? { 
                ...s, 
                name: formData.name!,
                description: formData.description!,
                criticality: formData.criticality as any,
                owner: formData.owner!,
                sla: formData.sla!
              } 
            : s
        )
      };
    } else {
      const newService: Service = {
        id: `SVC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        name: formData.name!,
        description: formData.description!,
        criticality: formData.criticality as any,
        owner: formData.owner!,
        sla: formData.sla!
      };
      updatedVendor = {
        ...vendor,
        services: [...vendor.services, newService]
      };
    }

    onUpdateVendor(updatedVendor);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-slate-200 bg-blue-50/30 flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Package className="w-5 h-5"/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Products & Services</h3>
                    <p className="text-xs text-slate-500">Registry of engaged third-party services and criticality</p>
                </div>
            </div>
            <div className="flex gap-2">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                    type="text" 
                    placeholder="Search services..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                    />
                </div>
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`p-2 border rounded-lg hover:bg-white flex items-center gap-2 transition-colors ${isFilterOpen || activeFilterCount > 0 ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600'}`}
                >
                    <Filter className="w-4 h-4" />
                    {activeFilterCount > 0 && <span className="text-xs font-bold bg-blue-200 px-1.5 rounded-full text-blue-800">{activeFilterCount}</span>}
                </button>
                <button 
                onClick={() => handleOpenModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                <Plus className="w-4 h-4" /> New Service
                </button>
            </div>
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
            <div className="p-4 bg-white rounded-lg border border-blue-100 shadow-sm space-y-4 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</h3>
                    <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-blue-600 underline">Clear All</button>
                </div>
                <div>
                        <label className="text-xs font-semibold text-slate-700 mb-2 block">Criticality</label>
                        <div className="flex flex-wrap gap-2">
                        {['Strategic', 'Critical', 'Operational'].map(crit => (
                            <label key={crit} className="flex items-center gap-2 text-sm cursor-pointer border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded bg-slate-50">
                                <input 
                                    type="checkbox" 
                                    checked={filters.criticality.includes(crit)}
                                    onChange={() => toggleFilter(crit)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{crit}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">Service Name</th>
            <th className="px-6 py-4">Vendor</th>
            <th className="px-6 py-4">Criticality</th>
            <th className="px-6 py-4">Owner / SLA</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allServices.map((service) => (
            <tr key={service.id} className="hover:bg-slate-50 group">
              <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded text-slate-500">
                          <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{service.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{service.description}</div>
                      </div>
                  </div>
              </td>
              <td className="px-6 py-4 text-slate-600 font-medium">{service.vendorName}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  service.criticality === 'Strategic' ? 'bg-purple-100 text-purple-700' :
                  service.criticality === 'Critical' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                    {service.criticality}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-600 text-xs">
                  <div className="flex items-center gap-1 mb-1">
                      <Users className="w-3 h-3 text-slate-400"/> {service.owner}
                  </div>
                  <div className="flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-slate-400"/> SLA: {service.sla}
                  </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(service)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(service.vendorId, service.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </td>
            </tr>
          ))}
          {allServices.length === 0 && (
            <tr><td colSpan={5} className="p-8 text-center text-slate-400">No services found matching your criteria.</td></tr>
          )}
        </tbody>
      </table>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Service" : "Add New Service"}
        maxWidth="3xl"
        footer={
            <>
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Save Service</button>
            </>
        }
      >
          <div className="space-y-4">
              {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                    <select 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={formData.vendorId}
                        onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                    >
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
              )}
              
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
                  <input 
                      type="text" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Cloud Compute, Payment Gateway"
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe the service scope..."
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Criticality</label>
                    <div className="space-y-2">
                        {['Operational', 'Critical', 'Strategic'].map(level => (
                            <label key={level} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                formData.criticality === level 
                                ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' 
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}>
                                <input 
                                    type="radio" 
                                    name="criticality"
                                    className="text-blue-600 focus:ring-blue-500"
                                    checked={formData.criticality === level}
                                    onChange={() => setFormData({...formData, criticality: level as any})}
                                />
                                <span className={`text-sm font-medium ${
                                    level === 'Strategic' ? 'text-purple-700' : 
                                    level === 'Critical' ? 'text-red-700' : 'text-slate-700'
                                }`}>{level}</span>
                            </label>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">SLA Target</label>
                        <input 
                          type="text" 
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={formData.sla}
                          onChange={(e) => setFormData({...formData, sla: e.target.value})}
                          placeholder="e.g. 99.99%"
                        />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Internal Owner</label>
                          <input 
                              type="text" 
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              value={formData.owner}
                              onChange={(e) => setFormData({...formData, owner: e.target.value})}
                              placeholder="e.g. CTO"
                          />
                      </div>
                  </div>
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default ProductsServicesView;
