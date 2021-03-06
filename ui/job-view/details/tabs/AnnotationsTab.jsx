import React from 'react';
import PropTypes from 'prop-types';

import { thEvents } from '../../../helpers/constants';
import { getBugUrl } from '../../../helpers/url';
import { withSelectedJob } from '../../context/SelectedJob';
import { withPushes } from '../../context/Pushes';
import { withNotifications } from '../../../shared/context/Notifications';
import { longDateFormat } from '../../../helpers/display';

function RelatedBugSaved(props) {
  const { deleteBug, bug } = props;
  const { bug_id } = bug;

  return (
    <span className="btn-group pinboard-related-bugs-btn">
      <a
        className="btn btn-xs annotations-bug related-bugs-link"
        href={getBugUrl(bug_id)}
        target="_blank"
        rel="noopener noreferrer"
        title={`View bug ${bug_id}`}
      >
        <em>{bug_id}</em>
      </a>
      <span
        className="btn classification-delete-icon hover-warning btn-xs pinned-job-close-btn annotations-bug"
        onClick={() => deleteBug(bug)}
        title={`Delete relation to bug ${bug_id}`}
      >
        <i className="fa fa-times-circle" />
      </span>
    </span>
  );
}

RelatedBugSaved.propTypes = {
  deleteBug: PropTypes.func.isRequired,
  bug: PropTypes.object.isRequired,
};

function RelatedBug(props) {
  const { bugs, deleteBug } = props;

  return (
    <span>
      <p className="annotations-bug-header font-weight-bold">Bugs</p>
      <ul className="annotations-bug-list">
        {bugs.map(bug => (
          <li key={bug.bug_id}>
            <RelatedBugSaved
              bug={bug}
              deleteBug={() => deleteBug(bug)}
            />
          </li>))}
      </ul>
    </span>
  );
}

RelatedBug.propTypes = {
  deleteBug: PropTypes.func.isRequired,
  bugs: PropTypes.array.isRequired,
};

function TableRow(props) {
  const { deleteClassification, classification, classificationMap } = props;
  const { created, who, name, text } = classification;
  const deleteEvent = () => { deleteClassification(classification); };
  const failureId = classification.failure_classification_id;
  const iconClass = failureId === 7 ? 'fa-star-o' : 'fa fa-star';
  const classificationName = classificationMap[failureId];

  return (
    <tr>
      <td>{new Date(created).toLocaleString('en-US', longDateFormat)}</td>
      <td>{who}</td>
      <td>
        {/* TODO: the classification label & star has been used in the job_details_pane.jxs
            so it should probably be made its own component when we start using import */}
        <span title={name}>
          <i className={`fa ${iconClass}`} />
          <span className="ml-1">{classificationName.name}</span>
        </span>
      </td>
      <td>{text}</td>
      <td>
        <span
          onClick={deleteEvent}
          className="classification-delete-icon hover-warning pointable"
          title="Delete this classification"
        >
          <i className="fa fa-times-circle" />
        </span>
      </td>
    </tr>
  );
}

TableRow.propTypes = {
  deleteClassification: PropTypes.func.isRequired,
  classification: PropTypes.object.isRequired,
  classificationMap: PropTypes.object.isRequired,
};

function AnnotationsTable(props) {
  const {
    classifications, deleteClassification, classificationMap,
  } = props;

  return (
    <table className="table-super-condensed table-hover">
      <thead>
        <tr>
          <th>Classified</th>
          <th>Author</th>
          <th>Classification</th>
          <th>Comment</th>
        </tr>
      </thead>
      <tbody>
        {classifications.map(classification => (
          <TableRow
            key={classification.id}
            classification={classification}
            deleteClassification={deleteClassification}
            classificationMap={classificationMap}
          />))
        }
      </tbody>
    </table>
  );
}

AnnotationsTable.propTypes = {
  deleteClassification: PropTypes.func.isRequired,
  classifications: PropTypes.array.isRequired,
  classificationMap: PropTypes.object.isRequired,
};

class AnnotationsTab extends React.Component {
  constructor(props) {
    super(props);

    this.deleteBug = this.deleteBug.bind(this);
    this.deleteClassification = this.deleteClassification.bind(this);
    this.onDeleteClassification = this.onDeleteClassification.bind(this);
  }

  componentDidMount() {
    window.addEventListener(thEvents.deleteClassification, this.onDeleteClassification);
  }

  componentWillUnmount() {
    window.removeEventListener(thEvents.deleteClassification, this.onDeleteClassification);
  }

  onDeleteClassification() {
    const { classifications, bugs, notify } = this.props;

    if (classifications.length) {
      this.deleteClassification(classifications[0]);
      // Delete any number of bugs if they exist
      bugs.forEach((bug) => { this.deleteBug(bug); });
    } else {
      notify('No classification on this job to delete', 'warning');
    }
  }

  deleteClassification(classification) {
    const { selectedJob, recalculateUnclassifiedCounts, notify } = this.props;

    selectedJob.failure_classification_id = 1;
    recalculateUnclassifiedCounts();

    classification.destroy().then(
      () => {
        notify('Classification successfully deleted', 'success');
        // also be sure the job object in question gets updated to the latest
        // classification state (in case one was added or removed).
        window.dispatchEvent(new CustomEvent(thEvents.classificationChanged));
      },
      () => {
        notify('Classification deletion failed', 'danger', { sticky: true });
      });
  }

  deleteBug(bug) {
    const { notify } = this.props;

    bug.destroy()
      .then(() => {
        notify(`Association to bug ${bug.bug_id} successfully deleted`, 'success');
        window.dispatchEvent(new CustomEvent(thEvents.classificationChanged));
      }, () => {
        notify(`Association to bug ${bug.bug_id} deletion failed`, 'danger', { sticky: true });
      });
  }

  render() {
    const { classifications, classificationMap, bugs } = this.props;

    return (
      <div className="container-fluid">
        <div className="row h-100">
          <div className="col-sm-10 classifications-pane">
            {classifications.length ?
              <AnnotationsTable
                classifications={classifications}
                deleteClassification={this.deleteClassification}
                classificationMap={classificationMap}
              /> :
              <p>This job has not been classified</p>
            }
          </div>

          {!!classifications.length && !!bugs.length &&
          <div className="col-sm-2 bug-list-pane">
            <RelatedBug
              bugs={bugs}
              deleteBug={this.deleteBug}
            />
          </div>}
        </div>
      </div>
    );
  }
}

AnnotationsTab.propTypes = {
  classificationMap: PropTypes.object.isRequired,
  bugs: PropTypes.array.isRequired,
  classifications: PropTypes.array.isRequired,
  recalculateUnclassifiedCounts: PropTypes.func.isRequired,
  notify: PropTypes.func.isRequired,
  selectedJob: PropTypes.object,
};

AnnotationsTab.defaultProps = {
  selectedJob: null,
};

export default withNotifications(withPushes(withSelectedJob(AnnotationsTab)));
