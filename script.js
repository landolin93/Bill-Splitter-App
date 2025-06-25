const { useState, useRef } = React;

function App() {
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [tax, setTax] = useState({ type: 'dollar', value: '' });
  const [tip, setTip] = useState({ percentage: '' });
  const [rounding, setRounding] = useState('none');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [cardCollapsed, setCardCollapsed] = useState({
    billItems: false,
    people: false,
    whoOrdered: false,
    taxTip: false,
    summary: false
  });
  const summaryRef = useRef(null);
  const individualBillRef = useRef(null);

  const toggleCard = (cardKey) => {
    setCardCollapsed(prev => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  const resetAll = () => {
    setItems([]);
    setPeople([]);
    setAssignments({});
    setTax({ type: 'dollar', value: '' });
    setTip({ percentage: '' });
    setRounding('none');
    setSelectedPerson(null);
    setNewItemName('');
    setNewItemPrice('');
    setNewPersonName('');
    setEditingItem(null);
    setEditName('');
    setEditPrice('');
    setShowChart(false);
    setCardCollapsed({
      billItems: false,
      people: false,
      whoOrdered: false,
      taxTip: false,
      summary: false
    });
  };

  const addItem = () => {
    if (newItemName.trim() && newItemPrice.trim()) {
      const newItem = {
        id: Date.now(),
        name: newItemName.trim(),
        price: parseFloat(newItemPrice)
      };
      setItems([...items, newItem]);
      setNewItemName('');
      setNewItemPrice('');
    }
  };

  const startEditItem = (item) => {
    setEditingItem(item.id);
    setEditName(item.name);
    setEditPrice(item.price.toString());
  };

  const saveEditItem = () => {
    if (editName.trim() && editPrice.trim()) {
      setItems(items.map(item => 
        item.id === editingItem 
          ? { ...item, name: editName.trim(), price: parseFloat(editPrice) }
          : item
      ));
      setEditingItem(null);
      setEditName('');
      setEditPrice('');
    }
  };

  const cancelEditItem = () => {
    setEditingItem(null);
    setEditName('');
    setEditPrice('');
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
    const newAssignments = { ...assignments };
    delete newAssignments[id];
    setAssignments(newAssignments);
    if (editingItem === id) {
      cancelEditItem();
    }
  };

  const addPerson = () => {
    if (newPersonName.trim()) {
      const newPerson = {
        id: Date.now(),
        name: newPersonName.trim()
      };
      setPeople([...people, newPerson]);
      setNewPersonName('');
    }
  };

  const deletePerson = (id) => {
    setPeople(people.filter(person => person.id !== id));
    const newAssignments = { ...assignments };
    Object.keys(newAssignments).forEach(itemId => {
      newAssignments[itemId] = newAssignments[itemId].filter(personId => personId !== id);
    });
    setAssignments(newAssignments);
  };

  const toggleAssignment = (itemId, personId) => {
    const currentAssignments = assignments[itemId] || [];
    const isAssigned = currentAssignments.includes(personId);
    
    if (isAssigned) {
      setAssignments({
        ...assignments,
        [itemId]: currentAssignments.filter(id => id !== personId)
      });
    } else {
      setAssignments({
        ...assignments,
        [itemId]: [...currentAssignments, personId]
      });
    }
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  const getTaxAmount = () => {
    const subtotal = getSubtotal();
    const taxValue = parseFloat(tax.value) || 0;
    if (tax.type === 'dollar') {
      return taxValue;
    } else {
      return subtotal * (taxValue / 100);
    }
  };

  const getBaseTipAmount = () => {
    const subtotal = getSubtotal();
    const tipValue = parseFloat(tip.percentage) || 0;
    return subtotal * (tipValue / 100);
  };

  const getTipAmount = () => {
    const baseTip = getBaseTipAmount();
    
    if (rounding === 'total') {
      const baseTotal = getBaseTotal();
      const roundedTotal = Math.ceil(baseTotal);
      const difference = roundedTotal - baseTotal;
      return baseTip + difference;
    } else if (rounding === 'individual') {
      const totalRoundingDifference = people.reduce((sum, person) => {
        const personBaseTotal = getPersonBaseTotal(person.id);
        const roundedPersonTotal = Math.ceil(personBaseTotal);
        return sum + (roundedPersonTotal - personBaseTotal);
      }, 0);
      return baseTip + totalRoundingDifference;
    } else {
      return baseTip;
    }
  };

  const getEffectiveTipPercentage = () => {
    const subtotal = getSubtotal();
    if (subtotal === 0) return 0;
    return (getTipAmount() / subtotal) * 100;
  };

  const getBaseTotal = () => {
    return getSubtotal() + getTaxAmount() + getBaseTipAmount();
  };

  const getTotal = () => {
    const baseTotal = getBaseTotal();
    
    if (rounding === 'total') {
      return Math.ceil(baseTotal);
    } else if (rounding === 'individual') {
      return people.reduce((sum, person) => {
        const personBaseTotal = getPersonBaseTotal(person.id);
        return sum + Math.ceil(personBaseTotal);
      }, 0);
    } else {
      return baseTotal;
    }
  };

  const getPersonBaseTotal = (personId) => {
    let personSubtotal = 0;
    
    items.forEach(item => {
      const assignedPeople = assignments[item.id] || [];
      if (assignedPeople.includes(personId)) {
        personSubtotal += item.price / assignedPeople.length;
      }
    });

    const totalSubtotal = getSubtotal();
    const proportion = totalSubtotal > 0 ? personSubtotal / totalSubtotal : 0;
    
    const personTax = getTaxAmount() * proportion;
    const personBaseTip = getBaseTipAmount() * proportion;
    
    return personSubtotal + personTax + personBaseTip;
  };

  const getPersonTotal = (personId) => {
    let personSubtotal = 0;
    
    items.forEach(item => {
      const assignedPeople = assignments[item.id] || [];
      if (assignedPeople.includes(personId)) {
        personSubtotal += item.price / assignedPeople.length;
      }
    });

    const totalSubtotal = getSubtotal();
    const proportion = totalSubtotal > 0 ? personSubtotal / totalSubtotal : 0;
    
    const personTax = getTaxAmount() * proportion;
    let personTip = getBaseTipAmount() * proportion;

    if (rounding === 'individual') {
      const personBaseTotal = personSubtotal + personTax + personTip;
      const roundedTotal = Math.ceil(personBaseTotal);
      const difference = roundedTotal - personBaseTotal;
      personTip += difference;
      
      return {
        subtotal: personSubtotal,
        tax: personTax,
        tip: personTip,
        total: roundedTotal
      };
    } else if (rounding === 'total') {
      const baseTotal = getBaseTotal();
      const roundedTotal = Math.ceil(baseTotal);
      const difference = roundedTotal - baseTotal;
      
      const personBaseTotal = personSubtotal + personTax + personTip;
      const adjustmentRatio = baseTotal > 0 ? personBaseTotal / baseTotal : 0;
      const personTipAdjustment = difference * adjustmentRatio;
      
      return {
        subtotal: personSubtotal,
        tax: personTax,
        tip: personTip + personTipAdjustment,
        total: personBaseTotal + personTipAdjustment
      };
    } else {
      return {
        subtotal: personSubtotal,
        tax: personTax,
        tip: personTip,
        total: personSubtotal + personTax + personTip
      };
    }
  };

  const getPersonItems = (personId) => {
    return items.filter(item => {
      const assignedPeople = assignments[item.id] || [];
      return assignedPeople.includes(personId);
    }).map(item => ({
      ...item,
      splitCost: item.price / (assignments[item.id]?.length || 1)
    }));
  };

  const toggleView = () => {
    setShowChart(!showChart);
  };

  const exportImages = async () => {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const downloadedImages = [];

    const downloadImage = async (canvas, filename) => {
      try {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        downloadedImages.push(filename);
      } catch (error) {
        console.error(`Failed to download ${filename}:`, error);
        throw error;
      }
    };

    try {
      // Ensure Summary card is expanded
      if (cardCollapsed.summary) {
        toggleCard('summary');
        await delay(1000);
      }

      // Capture Summary card in current view
      if (!summaryRef.current) throw new Error('Summary card not found');
      const summaryCanvas = await html2canvas(summaryRef.current, { scale: 2 });
      await downloadImage(summaryCanvas, `Summary-${showChart ? 'Chart' : 'Totals'}.png`);
      await delay(1000);

      // Toggle to opposite view and capture
      toggleView();
      await delay(1000);
      if (!summaryRef.current) throw new Error('Summary card not found after toggle');
      const summaryAltCanvas = await html2canvas(summaryRef.current, { scale: 2 });
      await downloadImage(summaryAltCanvas, `Summary-${showChart ? 'Chart' : 'Totals'}.png`);
      await delay(1000);
      toggleView();
      await delay(1000);

      // Capture individual check summaries
      for (const person of people) {
        setSelectedPerson(person);
        await delay(1000);
        if (!individualBillRef.current) throw new Error(`Individual check for ${person.name} not found`);
        const billCanvas = await html2canvas(individualBillRef.current, { scale: 2 });
        await downloadImage(billCanvas, `${person.name}-Check.png`);
        await delay(1000);
      }
      setSelectedPerson(null);

      alert(`Successfully exported ${downloadedImages.length} images to download. Please save them to your photo gallery.`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please check the console for details or try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Bill Splitter Calculator</h1>
          <button
            onClick={resetAll}
            className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition-colors font-medium"
          >Reset All</button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">🧾 Bill Items</h2>
              <button
                onClick={() => toggleCard('billItems')}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >{cardCollapsed.billItems ? '+' : '−'}</button>
            </div>
            {!cardCollapsed.billItems && (
              <div>
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addItem()}
                  />
                  <input
                    type="number"
                    placeholder="Price ($)"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addItem()}
                  />
                  <button
                    onClick={addItem}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                  >Add Item</button>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                      {editingItem === item.id ? (
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && saveEditItem()}
                            autoFocus
                          />
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && saveEditItem()}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveEditItem}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                            >Save</button>
                            <button
                              onClick={cancelEditItem}
                              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                            >Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditItem(item)}
                            className="flex-1 text-left hover:bg-gray-100 p-1 rounded transition-colors"
                          >
                            <span className="font-medium">{item.name}</span>
                            <span className="text-green-600 ml-2">${item.price.toFixed(2)}</span>
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-red-500 hover:text-red-700 text-xl font-bold ml-2"
                          >×</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">👥 People</h2>
              <button
                onClick={() => toggleCard('people')}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >{cardCollapsed.people ? '+' : '−'}</button>
            </div>
            {!cardCollapsed.people && (
              <div>
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="Person's name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addPerson()}
                  />
                  <button
                    onClick={addPerson}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                  >Add Person</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {people.map(person => (
                    <div key={person.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2">
                      <span>{person.name}</span>
                      <button
                        onClick={() => deletePerson(person.id)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">🍽️ Who Ordered What?</h2>
              <button
                onClick={() => toggleCard('whoOrdered')}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >{cardCollapsed.whoOrdered ? '+' : '−'}</button>
            </div>
            {!cardCollapsed.whoOrdered && (
              <div className="space-y-4">
                {items.map(item => {
                  const assignedPeople = assignments[item.id] || [];
                  const splitCount = assignedPeople.length;
                  const costPerPerson = splitCount > 0 ? item.price / splitCount : item.price;
                  
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-green-600">${item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {people.map(person => (
                          <button
                            key={person.id}
                            onClick={() => toggleAssignment(item.id, person.id)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              assignedPeople.includes(person.id)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >{person.name}</button>
                        ))}
                      </div>
                      {splitCount > 0 && (
                        <div className="text-sm text-gray-600">
                          Split {splitCount} way{splitCount > 1 ? 's' : ''}: ${costPerPerson.toFixed(2)} each
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">💸 Tax & Tip</h2>
              <button
                onClick={() => toggleCard('taxTip')}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >{cardCollapsed.taxTip ? '+' : '−'}</button>
            </div>
            {!cardCollapsed.taxTip && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax</label>
                  <div className="flex gap-2">
                    <select
                      value={tax.type}
                      onChange={(e) => setTax({ ...tax, type: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dollar">$</option>
                      <option value="percentage">%</option>
                    </select>
                    <input
                      type="number"
                      value={tax.value}
                      onChange={(e) => setTax({ ...tax, value: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={tax.type === 'percentage' ? 'Enter %' : 'Enter $'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tip (%)</label>
                  <input
                    type="number"
                    value={tip.percentage}
                    onChange={(e) => setTip({ percentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tip percentage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rounding</label>
                  <select
                    value={rounding}
                    onChange={(e) => setRounding(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">No rounding</option>
                    <option value="total">Round total bill up</option>
                    <option value="individual">Round each person up</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 h-fit lg:col-span-2" ref={summaryRef}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">📊 Summary</h2>
              <button
                onClick={() => toggleCard('summary')}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >{cardCollapsed.summary ? '+' : '−'}</button>
            </div>
            {!cardCollapsed.summary && (
              <div>
                <div className="bg-gray-50 p-4 rounded-md mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${getTaxAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tip:</span>
                      <div className="text-right">
                        <div>${getTipAmount().toFixed(2)}</div>
                        {rounding !== 'none' && getEffectiveTipPercentage() !== parseFloat(tip.percentage) && (
                          <div className="text-xs text-gray-600">
                            ({getEffectiveTipPercentage().toFixed(1)}% effective)
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>${getTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-800">Individual Totals</h3>
                  <button
                    onClick={toggleView}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors font-medium"
                  >
                    {showChart ? 'Show Totals' : 'Show Chart'}
                  </button>
                </div>
                {showChart ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-md">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Meal Cost</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Tax</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Tip</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {people.map(person => {
                          const costs = getPersonTotal(person.id);
                          return (
                            <tr key={person.id} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-800">{person.name}</td>
                              <td className="px-4 py-2 text-sm text-gray-800">${costs.subtotal.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm text-gray-800">${costs.tax.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm text-gray-800">${costs.tip.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm font-semibold text-blue-600">${costs.total.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {people.map(person => {
                      const personCosts = getPersonTotal(person.id);
                      return (
                        <button
                          key={person.id}
                          onClick={() => setSelectedPerson(person)}
                          className="bg-blue-50 p-3 rounded-md hover:bg-blue-100 transition-colors w-full text-left"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{person.name}</span>
                            <span className="text-blue-600 font-semibold">${personCosts.total.toFixed(2)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-6">
                  <button
                    onClick={exportImages}
                    className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition-colors font-medium"
                  >Export</button>
                </div>
              </div>
            )}
          </div>

          {selectedPerson && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedPerson(null)}
            >
              <div 
                className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                ref={individualBillRef}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{selectedPerson.name}'s Check</h3>
                    <button
                      onClick={() => setSelectedPerson(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >×</button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Items Ordered</h4>
                      <div className="space-y-2">
                        {getPersonItems(selectedPerson.id).map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name}</span>
                            <span>${item.splitCost.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-800 mb-2">Cost Breakdown</h4>
                      <div className="space-y-1 text-sm">
                        {(() => {
                          const costs = getPersonTotal(selectedPerson.id);
                          return (
                            <>
                              <div className="flex justify-between">
                                <span>Meal Cost:</span>
                                <span>${costs.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tax:</span>
                                <span>${costs.tax.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tip:</span>
                                <span>${costs.tip.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                <span>Total:</span>
                                <span>${costs.total.toFixed(2)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
