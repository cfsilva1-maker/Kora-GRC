
import React, { useState, useRef } from 'react';
import { 
  LayoutTemplate, Settings, Save, RotateCcw, Plus, GripVertical, 
  Eye, Type, List, CheckSquare, ChevronRight, ArrowLeft,
  AlignLeft, Calendar, Hash, ToggleLeft, Minus, Heading, Trash2, Edit3, Move
} from 'lucide-react';

// --- Types ---

type ElementType = 'header' | 'text' | 'textarea' | 'number' | 'select' | 'date' | 'boolean' | 'divider' | 'email';

interface FormElement {
  id: string;
  type: ElementType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select inputs
  width?: 'full' | 'half';
}

interface FormDefinition {
  id: string;
  name: string;
  description: string;
  menuItem: string;
  lastModified: string;
  elements: FormElement[];
}

// --- Mock Data: Initial State of Application Forms ---

const INITIAL_FORMS: FormDefinition[] = [
  {
    id: 'FORM-01',
    name: 'Vendor Profile (General)',
    description: 'Main intake form for new vendor registration and basic details.',
    menuItem: 'Vendor Repository > Vendors',
    lastModified: '2024-03-10',
    elements: [
      { id: 'el-1', type: 'header', label: 'Company Information' },
      { id: 'el-2', type: 'text', label: 'Vendor Name', required: true, width: 'full', placeholder: 'e.g. Acme Corp' },
      { id: 'el-3', type: 'select', label: 'Category', options: ['SaaS', 'Hardware', 'Services'], width: 'half' },
      { id: 'el-4', type: 'text', label: 'Tax ID / EIN', width: 'half' },
      { id: 'el-5', type: 'textarea', label: 'Description', placeholder: 'Brief overview of services...', width: 'full' },
      { id: 'el-6', type: 'divider', label: 'Divider' },
      { id: 'el-7', type: 'header', label: 'Primary Contact' },
      { id: 'el-8', type: 'text', label: 'Contact Name', width: 'half' },
      { id: 'el-9', type: 'email', label: 'Email Address', width: 'half' },
    ]
  },
  {
    id: 'FORM-02',
    name: 'Incident Report',
    description: 'Log form for operational incidents and security events.',
    menuItem: 'Monitoring & Incidents',
    lastModified: '2024-02-28',
    elements: [
      { id: 'inc-1', type: 'header', label: 'Incident Details' },
      { id: 'inc-2', type: 'text', label: 'Summary', required: true, width: 'full' },
      { id: 'inc-3', type: 'select', label: 'Severity', options: ['Low', 'Medium', 'High', 'Critical'], width: 'half' },
      { id: 'inc-4', type: 'date', label: 'Date Detected', width: 'half' },
      { id: 'inc-5', type: 'textarea', label: 'Impact Description', width: 'full' },
    ]
  },
  {
    id: 'FORM-03',
    name: 'Contract Details',
    description: 'Metadata fields for legal agreements.',
    menuItem: 'Vendor Repository > Contracts',
    lastModified: '2024-01-15',
    elements: [
      { id: 'con-1', type: 'text', label: 'Contract Title', required: true, width: 'full' },
      { id: 'con-2', type: 'select', label: 'Type', options: ['MSA', 'NDA', 'DPA'], width: 'half' },
      { id: 'con-3', type: 'date', label: 'Renewal Date', width: 'half' },
    ]
  }
];

// --- Toolbox Items Config ---

const TOOLBOX_ITEMS: { type: ElementType; icon: React.ReactNode; label: string }[] = [
  { type: 'header', icon: <Heading className="w-4 h-4"/>, label: 'Section Header' },
  { type: 'divider', icon: <Minus className="w-4 h-4"/>, label: 'Divider' },
  { type: 'text', icon: <Type className="w-4 h-4"/>, label: 'Text Input' },
  { type: 'textarea', icon: <AlignLeft className="w-4 h-4"/>, label: 'Text Area' },
  { type: 'number', icon: <Hash className="w-4 h-4"/>, label: 'Number' },
  { type: 'email', icon: <Type className="w-4 h-4"/>, label: 'Email' },
  { type: 'select', icon: <List className="w-4 h-4"/>, label: 'Dropdown' },
  { type: 'date', icon: <Calendar className="w-4 h-4"/>, label: 'Date Picker' },
  { type: 'boolean', icon: <ToggleLeft className="w-4 h-4"/>, label: 'Checkbox / Toggle' },
];

const PageLayoutConfigView: React.FC = () => {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [forms, setForms] = useState<FormDefinition[]>(INITIAL_FORMS);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  
  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<{ type: ElementType | 'existing', index?: number } | null>(null);

  const currentForm = forms.find(f => f.id === selectedFormId);

  // --- Handlers ---

  const handleEditForm = (id: string) => {
    setSelectedFormId(id);
    setView('editor');
  };

  const handleSaveForm = () => {
    // In a real app, this would perform an API call
    setView('list');
    setSelectedFormId(null);
  };

  const handleDragStartToolbox = (type: ElementType) => {
    setDraggedItem({ type });
  };

  const handleDragStartCanvas = (index: number) => {
    setDraggedItem({ type: 'existing', index });
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem || !currentForm) return;

    const newForms = [...forms];
    const formIndex = newForms.findIndex(f => f.id === selectedFormId);
    const updatedElements = [...newForms[formIndex].elements];

    if (draggedItem.type === 'existing' && draggedItem.index !== undefined) {
      // Reordering existing item
      const [movedItem] = updatedElements.splice(draggedItem.index, 1);
      updatedElements.splice(dropIndex, 0, movedItem);
    } else {
      // Adding new item from toolbox
      const newElement: FormElement = {
        id: `field-${Date.now()}`,
        type: draggedItem.type as ElementType,
        label: `New ${draggedItem.type}`,
        width: 'full',
        required: false
      };
      updatedElements.splice(dropIndex, 0, newElement);
    }

    newForms[formIndex].elements = updatedElements;
    setForms(newForms);
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Essential to allow dropping
  };

  const handleDeleteElement = (index: number) => {
    if (!currentForm) return;
    const newForms = [...forms];
    const formIndex = newForms.findIndex(f => f.id === selectedFormId);
    newForms[formIndex].elements.splice(index, 1);
    setForms(newForms);
  };

  const handleUpdateElement = (index: number, updates: Partial<FormElement>) => {
    if (!currentForm) return;
    const newForms = [...forms];
    const formIndex = newForms.findIndex(f => f.id === selectedFormId);
    newForms[formIndex].elements[index] = { ...newForms[formIndex].elements[index], ...updates };
    setForms(newForms);
  };

  // --- Renderers ---

  const renderFieldPreview = (element: FormElement) => {
    switch (element.type) {
      case 'header':
        return <h3 className="text-lg font-bold text-slate-800 border-b pb-1 mb-2">{element.label}</h3>;
      case 'divider':
        return <hr className="my-4 border-slate-200" />;
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <div className="w-10 h-5 bg-slate-200 rounded-full relative">
               <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
            </div>
            <label className="text-sm font-medium text-slate-700">{element.label} {element.required && <span className="text-red-500">*</span>}</label>
          </div>
        );
      case 'textarea':
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{element.label} {element.required && <span className="text-red-500">*</span>}</label>
            <div className="h-20 w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-400">
              {element.placeholder || 'Text area...'}
            </div>
          </div>
        );
      case 'select':
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{element.label} {element.required && <span className="text-red-500">*</span>}</label>
            <div className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-500 flex justify-between items-center">
              <span>Select option...</span>
              <ChevronRight className="w-4 h-4 rotate-90"/>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{element.label} {element.required && <span className="text-red-500">*</span>}</label>
            <input 
              disabled 
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 disabled:bg-slate-50"
              placeholder={element.placeholder || `Enter ${element.label}`}
            />
          </div>
        );
    }
  };

  // --- Views ---

  if (view === 'editor' && currentForm) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col animate-fade-in">
        {/* Editor Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5"/>
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{currentForm.name}</h2>
              <p className="text-xs text-slate-500">Editing Layout • Changes auto-saved to preview</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
                <Eye className="w-4 h-4"/> Preview Mode
             </button>
             <button onClick={handleSaveForm} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">
                <Save className="w-4 h-4"/> Save & Close
             </button>
          </div>
        </div>

        {/* Builder Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Toolbox */}
          <div className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col overflow-y-auto">
             <div className="p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Layout Elements</h3>
                <div className="grid grid-cols-2 gap-2 mb-6">
                   {TOOLBOX_ITEMS.filter(i => ['header', 'divider'].includes(i.type)).map(item => (
                      <div 
                        key={item.type}
                        draggable
                        onDragStart={() => handleDragStartToolbox(item.type)}
                        className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-grab transition-all text-slate-600"
                      >
                         {item.icon}
                         <span className="text-[10px] font-medium mt-1">{item.label}</span>
                      </div>
                   ))}
                </div>

                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Basic Fields</h3>
                <div className="space-y-2">
                   {TOOLBOX_ITEMS.filter(i => !['header', 'divider'].includes(i.type)).map(item => (
                      <div 
                        key={item.type}
                        draggable
                        onDragStart={() => handleDragStartToolbox(item.type)}
                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 hover:shadow-sm cursor-grab transition-all group"
                      >
                         <div className="text-slate-400 group-hover:text-indigo-500">{item.icon}</div>
                         <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{item.label}</span>
                         <GripVertical className="w-4 h-4 text-slate-300 ml-auto opacity-0 group-hover:opacity-100"/>
                      </div>
                   ))}
                </div>
             </div>
             
             <div className="mt-auto p-4 bg-slate-50 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  Drag items from this list onto the canvas on the right to add them to your form.
                </p>
             </div>
          </div>

          {/* Right Panel: Canvas */}
          <div className="flex-1 bg-slate-100 overflow-y-auto p-8 relative">
             <div className="max-w-3xl mx-auto bg-white min-h-[800px] shadow-sm border border-slate-200 rounded-xl p-8 relative">
                
                {currentForm.elements.length === 0 && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-50">
                      <LayoutTemplate className="w-16 h-16 text-slate-300 mb-4"/>
                      <p className="text-slate-400 font-medium">Your form is empty.</p>
                      <p className="text-slate-400 text-sm">Drag elements here to start building.</p>
                   </div>
                )}

                <div 
                  className="space-y-2 min-h-full pb-20"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, currentForm.elements.length)}
                >
                   {currentForm.elements.map((element, idx) => (
                      <div 
                        key={element.id}
                        draggable
                        onDragStart={() => handleDragStartCanvas(idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => { e.stopPropagation(); handleDrop(e, idx); }}
                        className={`group relative border-2 border-transparent hover:border-indigo-100 rounded-lg transition-all ${element.width === 'half' ? 'w-[48%] inline-block mr-[2%] align-top mb-4' : 'w-full mb-4'}`}
                      >
                         {/* Edit Overlay Controls */}
                         <div className="absolute -top-3 -right-3 hidden group-hover:flex items-center gap-1 bg-white shadow-sm border border-slate-200 rounded-lg p-1 z-10">
                            <button 
                              onClick={() => handleUpdateElement(idx, { width: element.width === 'full' ? 'half' : 'full' })}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500" 
                              title="Toggle Width"
                            >
                               {element.width === 'full' ? <Minus className="w-3 h-3"/> : <Move className="w-3 h-3"/>}
                            </button>
                            <div className="w-px h-3 bg-slate-200 mx-1"></div>
                            <button onClick={() => handleDeleteElement(idx)} className="p-1.5 hover:bg-red-50 text-red-500 rounded" title="Delete">
                               <Trash2 className="w-3 h-3"/>
                            </button>
                         </div>

                         {/* Inline Label Editing */}
                         <div className="p-2 group-hover:bg-slate-50/50 rounded-lg">
                            <div className="mb-2">
                               {element.type === 'header' || element.type === 'divider' ? null : (
                                  <input 
                                    type="text" 
                                    value={element.label}
                                    onChange={(e) => handleUpdateElement(idx, { label: e.target.value })}
                                    className="bg-transparent border-none p-0 text-sm font-medium text-slate-700 focus:ring-0 w-full hover:bg-white focus:bg-white transition-colors"
                                  />
                               )}
                            </div>
                            
                            <div className="pointer-events-none">
                               {renderFieldPreview(element)}
                            </div>
                         </div>
                      </div>
                   ))}
                   
                   {/* Drop Zone Indicator at bottom */}
                   <div 
                      className="h-20 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                   >
                      Drop items here
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    );
  }

  // --- List View ---

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Pages Layout and Configuration</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Manage all form layouts within the application. Customize fields, layout structure, and validation rules using the visual builder.
            </p>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
               <tr>
                  <th className="px-6 py-4">Form Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Menu Item Location</th>
                  <th className="px-6 py-4">Last Modified</th>
                  <th className="px-6 py-4 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {forms.map(form => (
                  <tr key={form.id} className="hover:bg-slate-50 transition-colors group">
                     <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                           <List className="w-4 h-4 text-indigo-500"/>
                           {form.name}
                        </div>
                     </td>
                     <td className="px-6 py-4 text-slate-600">{form.description}</td>
                     <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 font-medium border border-slate-200">
                           <LayoutTemplate className="w-3 h-3"/> {form.menuItem}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-slate-500 text-xs">{form.lastModified}</td>
                     <td className="px-6 py-4 text-right">
                        <button 
                           onClick={() => handleEditForm(form.id)}
                           className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                           <Edit3 className="w-3 h-3"/> Edit Layout
                        </button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default PageLayoutConfigView;
