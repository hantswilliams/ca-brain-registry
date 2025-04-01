from flask_restx import Namespace, Resource, fields

# Create a namespace for value sets endpoints
value_sets_ns = Namespace('value-sets', description='Reference data and value sets')

# Define models for response documentation
value_set_item_model = value_sets_ns.model('ValueSetItem', {
    'code': fields.String(description="Code value", example="active"),
    'display': fields.String(description="Display name", example="Active"),
    'description': fields.String(description="Description", example="The condition is currently active and relevant"),
    'active': fields.Boolean(description="Whether the value is active", example=True),
})

# Define routes and their documentation
@value_sets_ns.route('/genders')
class GenderValueSet(Resource):
    @value_sets_ns.doc('get_genders', responses={
        200: 'List of gender values',
        500: 'Server error'
    })
    @value_sets_ns.marshal_list_with(value_set_item_model)
    def get(self):
        """Get the list of supported gender values"""
        return []  # The actual implementation returns real data

@value_sets_ns.route('/condition-statuses')
class ConditionStatusValueSet(Resource):
    @value_sets_ns.doc('get_condition_statuses', responses={
        200: 'List of condition status values',
        500: 'Server error'
    })
    @value_sets_ns.marshal_list_with(value_set_item_model)
    def get(self):
        """Get the list of supported condition status values"""
        return []  # The actual implementation returns real data

@value_sets_ns.route('/neurological-conditions')
class NeurologicalConditionValueSet(Resource):
    @value_sets_ns.doc('get_neurological_conditions', responses={
        200: 'List of neurological condition codes',
        500: 'Server error'
    })
    @value_sets_ns.marshal_list_with(value_set_item_model)
    def get(self):
        """Get the list of supported neurological condition codes"""
        return []  # The actual implementation returns real data

@value_sets_ns.route('/sync-statuses')
class SyncStatusValueSet(Resource):
    @value_sets_ns.doc('get_sync_statuses', responses={
        200: 'List of sync status values',
        500: 'Server error'
    })
    @value_sets_ns.marshal_list_with(value_set_item_model)
    def get(self):
        """Get the list of supported synchronization status values"""
        return []  # The actual implementation returns real data